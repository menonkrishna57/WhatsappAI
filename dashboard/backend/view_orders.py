import os
import uuid
from typing import Any, Dict, List, NotRequired, TypedDict, cast

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query, Depends, Request
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import Security
from pydantic import BaseModel, ConfigDict
from fastapi.middleware.cors import CORSMiddleware
from supabase import Client, create_client

from auth_backend import get_current_tenant_id


# Load env from root directory
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
load_dotenv(dotenv_path=dotenv_path)

app = FastAPI(
	title="Orders API",
	description="Fetch order data from Supabase",
	version="1.0.0",
)

_default_origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
_extra_origins = os.environ.get("ALLOWED_ORIGINS", "")
_allowed_origins = _default_origins + [o.strip() for o in _extra_origins.split(",") if o.strip()]

app.add_middleware(
	CORSMiddleware,
	allow_origins=_allowed_origins,
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)


class OrderRecord(TypedDict):
	order_id: int
	created_at: str
	customer_id: str
	tenant_id: int
	payments: NotRequired[List[str]]


class TenantSettingsPayload(BaseModel):
	# Ignore any extra fields sent by the frontend (e.g. logo_initials, team_members)
	model_config = ConfigDict(extra='ignore')

	business_name: str | None = None
	whatsapp_number: str | None = None
	ai_tone: str | None = None
	currency: str | None = None
	google_business_id: str | None = None
	business_category: str | None = None
	description: str | None = None
	business_address: str | None = None
	logo_url: str | None = None
	whatsapp_connected: bool = False
	ai_auto_reply: bool = True
	ai_handoff_keywords: str | None = None
	notify_new_chat: bool = True
	notify_new_booking: bool = True
	notify_payment: bool = False


class CampaignPayload(BaseModel):
	name: str
	description: str | None = None
	type: str = 'Broadcast'
	audience_count: int = 0
	status: str = 'Draft'
	delivery_rate: float = 0.0
	sent_on: str | None = None


class ProductPayload(BaseModel):
	name: str
	price_cents: int
	material: str | None = None
	sizes: List[str] | None = None
	colors: List[str] | None = None
	in_stock: bool = True
	is_returnable: bool = True
	return_window_days: int | None = None
	description: str | None = None


class ProductImagePayload(BaseModel):
	image_url: str


def get_supabase_client() -> Client:
	supabase_url = os.getenv("SUPABASE_URL")
	supabase_key = os.getenv("SUPABASE_KEY")

	if not supabase_url or not supabase_key:
		raise HTTPException(
			status_code=500,
			detail="SUPABASE_URL and SUPABASE_KEY must be set in environment variables or .env",
		)

	return create_client(supabase_url, supabase_key)


def get_authed_supabase_client(token: str) -> Client:
	"""Create a Supabase client authenticated with the user's JWT.
	
	Uses postgrest.auth() to inject the user's Bearer token so that
	Row-Level Security (RLS) policies are satisfied for all PostgREST
	calls made through this client.
	"""
	supabase_url = os.getenv("SUPABASE_URL")
	supabase_key = os.getenv("SUPABASE_KEY")

	if not supabase_url or not supabase_key:
		raise HTTPException(
			status_code=500,
			detail="SUPABASE_URL and SUPABASE_KEY must be set in environment variables or .env",
		)

	client = create_client(supabase_url, supabase_key)
	# Inject the user JWT so PostgREST evaluates RLS as the logged-in user.
	# This is the correct approach in supabase-py v2 without needing a refresh token.
	client.postgrest.auth(token)
	return client


_bearer_scheme = HTTPBearer()


def get_token(creds: HTTPAuthorizationCredentials = Security(_bearer_scheme)) -> str:
	"""Extract the raw Bearer token from the Authorization header."""
	return creds.credentials


@app.get("/health")
def health_check() -> JSONResponse:
	"""Single health endpoint for API and Supabase connectivity."""
	content: Dict[str, Any] = {
		"success": True,
		"status": "ok",
		"api": "up",
		"supabase": {
			"status": "unknown",
			"message": "Not checked",
		},
	}

	status_code = 200

	try:
		supabase = get_supabase_client()
		query_result = (
			supabase
			.schema("public")
			.table("orders")
			.select("order_id")
			.limit(1)
			.execute()
		)
		content["supabase"] = {
			"status": "connected",
			"message": "Supabase connection successful",
			"checked_table": "public.orders",
			"sample_count": len(query_result.data or []),
		}
	except HTTPException as exc:
		status_code = 500
		content["success"] = False
		content["status"] = "degraded"
		content["supabase"] = {
			"status": "misconfigured",
			"message": "Supabase environment variables are missing or invalid",
			"detail": str(exc.detail),
		}
	except Exception as exc:
		status_code = 503
		content["success"] = False
		content["status"] = "degraded"
		content["supabase"] = {
			"status": "unreachable",
			"message": "Failed to connect to Supabase",
			"detail": str(exc),
		}

	return JSONResponse(status_code=status_code, content=content)


@app.get("/orders")
def get_orders(
	limit: int = Query(default=100, ge=1, le=1000),
	tenant_id: int = Depends(get_current_tenant_id),
) -> JSONResponse:
	"""Fetch rows from public.orders."""
	try:
		supabase = get_supabase_client()
		query = supabase.schema("public").table("orders").select(
			"order_id, created_at, customer_id, tenant_id, payments"
		)

		query = query.eq("tenant_id", tenant_id)

		query_result = query.limit(limit).execute()
		orders = cast(List[OrderRecord], query_result.data or [])
		return JSONResponse(
			status_code=200,
			content={
				"success": True,
				"count": len(orders),
				"tenant_id": tenant_id,
				"orders": orders,
			},
		)
	except HTTPException:
		raise
	except Exception as exc:
		raise HTTPException(
			status_code=500,
			detail=f"Failed to fetch orders from Supabase: {exc}",
		) from exc


@app.get("/payments")
def get_payments(
	limit: int = Query(default=100, ge=1, le=1000),
	tenant_id: int = Depends(get_current_tenant_id)
) -> JSONResponse:
	"""Fetch payments from public.app_payments."""
	try:
		supabase = get_supabase_client()
		query = supabase.schema("public").table("app_payments").select("*")

		query = query.eq("tenant_id", tenant_id)

		query_result = query.limit(limit).execute()
		payments = cast(List[Dict[str, Any]], query_result.data or [])
		return JSONResponse(
			status_code=200,
			content={
				"success": True,
				"count": len(payments),
				"tenant_id": tenant_id,
				"payments": payments,
			},
		)
	except HTTPException:
		raise
	except Exception as exc:
		raise HTTPException(
			status_code=500,
			detail=f"Failed to fetch payments from Supabase: {exc}",
		) from exc


@app.get("/settings")
def get_settings(tenant_id: int = Depends(get_current_tenant_id)) -> JSONResponse:
	"""Fetch all settings for the tenant."""
	try:
		supabase = get_supabase_client()
		tenant_result = supabase.schema("public").table("app_tenants").select(
			"business_name, whatsapp_number, ai_tone, currency, google_business_id"
		).eq("tenant_id", tenant_id).execute()
		
		if not tenant_result.data:
			raise HTTPException(status_code=404, detail="Tenant settings not found")
		
		settings_result = supabase.schema("public").table("app_tenant_settings").select(
			"business_category, description, business_address, logo_url, whatsapp_connected, ai_auto_reply, ai_handoff_keywords, notify_new_chat, notify_new_booking, notify_payment"
		).eq("tenant_id", tenant_id).execute()
			
		tenant_data = tenant_result.data[0]
		settings_data = settings_result.data[0] if settings_result.data else {
			"business_category": None,
			"description": None,
			"business_address": None,
			"logo_url": None,
			"whatsapp_connected": False,
			"ai_auto_reply": True,
			"ai_handoff_keywords": "refund, complaint, manager",
			"notify_new_chat": True,
			"notify_new_booking": True,
			"notify_payment": False
		}
		
		combined_settings = {**tenant_data, **settings_data}
		
		return JSONResponse(status_code=200, content={"success": True, "settings": combined_settings})
	except HTTPException:
		raise
	except Exception as exc:
		raise HTTPException(status_code=500, detail=str(exc))

@app.put("/settings")
def update_settings(
	payload: TenantSettingsPayload,
	tenant_id: int = Depends(get_current_tenant_id),
	token: str = Depends(get_token),
) -> JSONResponse:
	"""Update tenant settings.
	
	Uses the anon client for app_tenants (service-level write) and an
	authenticated client (user JWT) for app_tenant_settings so that
	Row-Level Security policies are satisfied.
	"""
	try:
		supabase = get_supabase_client()
		authed_supabase = get_authed_supabase_client(token)
		payload_dict = payload.model_dump(exclude_unset=True)
		
		tenant_keys = ["business_name", "whatsapp_number", "ai_tone", "currency", "google_business_id"]
		tenant_update = {k: v for k, v in payload_dict.items() if k in tenant_keys}
		settings_update = {k: v for k, v in payload_dict.items() if k not in tenant_keys}
		
		if tenant_update:
			supabase.schema("public").table("app_tenants").update(tenant_update).eq("tenant_id", tenant_id).execute()
		
		if settings_update:
			settings_update["tenant_id"] = tenant_id
			# Use authed client so the user's JWT passes RLS on app_tenant_settings
			authed_supabase.schema("public").table("app_tenant_settings").upsert(settings_update).execute()
			
		return get_settings(tenant_id)
	except HTTPException:
		raise
	except Exception as exc:
		raise HTTPException(status_code=500, detail=str(exc))


# --- Customers Endpoints ---

@app.get("/customers")
def get_customers(
	limit: int = Query(default=100, ge=1, le=1000),
	tenant_id: int = Depends(get_current_tenant_id)
) -> JSONResponse:
	"""Fetch customers from app_customers for the tenant."""
	try:
		supabase = get_supabase_client()
		query_result = supabase.schema("public").table("app_customers").select("*").eq("tenant_id", tenant_id).limit(limit).execute()
		customers = query_result.data or []
		return JSONResponse(
			status_code=200,
			content={
				"success": True,
				"count": len(customers),
				"customers": customers,
			},
		)
	except HTTPException:
		raise
	except Exception as exc:
		raise HTTPException(status_code=500, detail=str(exc))


class CustomerNotesPayload(BaseModel):
	notes: str


@app.put("/customers/{customer_id}/notes")
def update_customer_notes(
	customer_id: str,
	payload: CustomerNotesPayload,
	tenant_id: int = Depends(get_current_tenant_id)
) -> JSONResponse:
	"""Update the notes field for a customer. Requires a `notes` text column
	on app_customers -- see README for the migration."""
	try:
		supabase = get_supabase_client()
		update_result = (
			supabase.schema("public")
			.table("app_customers")
			.update({"notes": payload.notes})
			.eq("tenant_id", tenant_id)
			.eq("customer_id", customer_id)
			.execute()
		)

		if not update_result.data:
			raise HTTPException(status_code=404, detail="Customer not found or not owned by tenant")

		return JSONResponse(
			status_code=200,
			content={"success": True, "customer": update_result.data[0]},
		)
	except HTTPException:
		raise
	except Exception as exc:
		raise HTTPException(status_code=500, detail=str(exc))


# --- Escalations Endpoints ---

@app.get("/escalations")
def get_escalations(
	status: str | None = Query(default=None),
	limit: int = Query(default=100, ge=1, le=1000),
	tenant_id: int = Depends(get_current_tenant_id)
) -> JSONResponse:
	"""Fetch escalations (AI hand-offs to a human) for the tenant, most recent first."""
	try:
		supabase = get_supabase_client()
		query = (
			supabase.schema("public")
			.table("app_escalations")
			.select("*")
			.eq("tenant_id", tenant_id)
			.order("created_at", desc=True)
			.limit(limit)
		)
		if status:
			query = query.eq("status", status)
		query_result = query.execute()
		escalations = query_result.data or []
		return JSONResponse(
			status_code=200,
			content={
				"success": True,
				"count": len(escalations),
				"escalations": escalations,
			},
		)
	except HTTPException:
		raise
	except Exception as exc:
		raise HTTPException(status_code=500, detail=str(exc))


class EscalationStatusPayload(BaseModel):
	status: str


@app.put("/escalations/{escalation_id}")
def update_escalation_status(
	escalation_id: str,
	payload: EscalationStatusPayload,
	tenant_id: int = Depends(get_current_tenant_id)
) -> JSONResponse:
	"""Mark an escalation as resolved/open/etc."""
	try:
		supabase = get_supabase_client()
		update_result = (
			supabase.schema("public")
			.table("app_escalations")
			.update({"status": payload.status})
			.eq("tenant_id", tenant_id)
			.eq("escalation_id", escalation_id)
			.execute()
		)

		if not update_result.data:
			raise HTTPException(status_code=404, detail="Escalation not found or not owned by tenant")

		return JSONResponse(
			status_code=200,
			content={"success": True, "escalation": update_result.data[0]},
		)
	except HTTPException:
		raise
	except Exception as exc:
		raise HTTPException(status_code=500, detail=str(exc))


# --- Product Endpoints ---

@app.get("/products")
def get_products(
	limit: int = Query(default=100, ge=1, le=1000),
	tenant_id: int = Depends(get_current_tenant_id)
) -> JSONResponse:
	"""Fetch products for the tenant, with their images attached."""
	try:
		supabase = get_supabase_client()
		query_result = supabase.schema("public").table("app_products").select("*").eq("tenant_id", tenant_id).limit(limit).execute()
		products = query_result.data or []

		product_ids = [p["product_id"] for p in products if p.get("product_id")]
		images_by_product: Dict[str, List[str]] = {}
		if product_ids:
			images_result = (
				supabase.schema("public")
				.table("product_images")
				.select("product_id, image_url")
				.in_("product_id", product_ids)
				.execute()
			)
			for row in images_result.data or []:
				images_by_product.setdefault(row["product_id"], []).append(row["image_url"])

		for p in products:
			p["image_urls"] = images_by_product.get(p.get("product_id"), [])

		return JSONResponse(
			status_code=200,
			content={
				"success": True,
				"count": len(products),
				"products": products,
			},
		)
	except HTTPException:
		raise
	except Exception as exc:
		raise HTTPException(status_code=500, detail=str(exc))


@app.post("/products")
def create_product(
	payload: ProductPayload,
	tenant_id: int = Depends(get_current_tenant_id)
) -> JSONResponse:
	"""Create a new product."""
	try:
		supabase = get_supabase_client()
		
		product_data = payload.dict(exclude_none=True)
		product_data["tenant_id"] = tenant_id
		product_data["product_id"] = str(uuid.uuid4()) # Generate a unique product string ID
		
		insert_result = supabase.schema("public").table("app_products").insert(product_data).execute()
		
		return JSONResponse(
			status_code=201,
			content={
				"success": True,
				"product": insert_result.data[0] if insert_result.data else None,
			},
		)
	except HTTPException:
		raise
	except Exception as exc:
		raise HTTPException(status_code=500, detail=str(exc))


@app.put("/products/{product_id}")
def update_product(
	product_id: str,
	payload: ProductPayload,
	tenant_id: int = Depends(get_current_tenant_id)
) -> JSONResponse:
	"""Update an existing product."""
	try:
		supabase = get_supabase_client()
		
		product_data = payload.dict()
		# exclude nulls if needed, or explicitly set to null depending on user intent
		
		update_result = supabase.schema("public").table("app_products").update(product_data).eq("tenant_id", tenant_id).eq("product_id", product_id).execute()
		
		if not update_result.data:
			raise HTTPException(status_code=404, detail="Product not found or not owned by tenant")
			
		return JSONResponse(
			status_code=200,
			content={
				"success": True,
				"product": update_result.data[0],
			},
		)
	except HTTPException:
		raise
	except Exception as exc:
		raise HTTPException(status_code=500, detail=str(exc))


@app.delete("/products/{product_id}")
def delete_product(
	product_id: str,
	tenant_id: int = Depends(get_current_tenant_id)
) -> JSONResponse:
	"""Delete an existing product."""
	try:
		supabase = get_supabase_client()
		
		delete_result = supabase.schema("public").table("app_products").delete().eq("tenant_id", tenant_id).eq("product_id", product_id).execute()
		
		if not delete_result.data:
			raise HTTPException(status_code=404, detail="Product not found or not owned by tenant")
			
		return JSONResponse(
			status_code=200,
			content={
				"success": True,
				"message": "Product deleted successfully"
			},
		)
	except HTTPException:
		raise
	except Exception as exc:
		raise HTTPException(status_code=500, detail=str(exc))


def _assert_product_owned(supabase: Client, product_id: str, tenant_id: int) -> None:
	"""Raise 404 unless product_id belongs to tenant_id. product_images has no
	tenant_id of its own, so ownership must be checked via app_products."""
	owner_check = (
		supabase.schema("public")
		.table("app_products")
		.select("product_id")
		.eq("product_id", product_id)
		.eq("tenant_id", tenant_id)
		.execute()
	)
	if not owner_check.data:
		raise HTTPException(status_code=404, detail="Product not found or not owned by tenant")


@app.post("/products/{product_id}/images")
def add_product_image(
	product_id: str,
	payload: ProductImagePayload,
	tenant_id: int = Depends(get_current_tenant_id)
) -> JSONResponse:
	"""Attach an already-uploaded image (Supabase Storage URL) to a product."""
	try:
		supabase = get_supabase_client()
		_assert_product_owned(supabase, product_id, tenant_id)

		insert_result = (
			supabase.schema("public")
			.table("product_images")
			.insert({"product_id": product_id, "image_url": payload.image_url})
			.execute()
		)

		return JSONResponse(
			status_code=201,
			content={
				"success": True,
				"image": insert_result.data[0] if insert_result.data else None,
			},
		)
	except HTTPException:
		raise
	except Exception as exc:
		raise HTTPException(status_code=500, detail=str(exc))


@app.delete("/products/{product_id}/images/{image_id}")
def delete_product_image(
	product_id: str,
	image_id: str,
	tenant_id: int = Depends(get_current_tenant_id)
) -> JSONResponse:
	"""Remove a single image row from a product."""
	try:
		supabase = get_supabase_client()
		_assert_product_owned(supabase, product_id, tenant_id)

		delete_result = (
			supabase.schema("public")
			.table("product_images")
			.delete()
			.eq("id", image_id)
			.eq("product_id", product_id)
			.execute()
		)

		if not delete_result.data:
			raise HTTPException(status_code=404, detail="Image not found for this product")

		return JSONResponse(
			status_code=200,
			content={"success": True, "message": "Image deleted successfully"},
		)
	except HTTPException:
		raise
	except Exception as exc:
		raise HTTPException(status_code=500, detail=str(exc))
# --- Campaigns Endpoints ---

@app.get("/campaigns")
def get_campaigns(
	limit: int = Query(default=100, ge=1, le=1000),
	tenant_id: int = Depends(get_current_tenant_id)
) -> JSONResponse:
	"""Fetch campaigns for the tenant."""
	try:
		supabase = get_supabase_client()
		query_result = supabase.schema("public").table("app_campaigns").select("*").eq("tenant_id", tenant_id).order("created_at", desc=True).limit(limit).execute()
		campaigns = query_result.data or []
		return JSONResponse(
			status_code=200,
			content={
				"success": True,
				"count": len(campaigns),
				"campaigns": campaigns,
			},
		)
	except HTTPException:
		raise
	except Exception as exc:
		raise HTTPException(status_code=500, detail=str(exc))


@app.post("/campaigns")
def create_campaign(
	payload: CampaignPayload,
	tenant_id: int = Depends(get_current_tenant_id)
) -> JSONResponse:
	"""Create a new campaign."""
	try:
		supabase = get_supabase_client()
		campaign_data = payload.dict(exclude_unset=True)
		campaign_data["tenant_id"] = tenant_id
		campaign_data["campaign_id"] = str(uuid.uuid4())
		
		insert_result = supabase.schema("public").table("app_campaigns").insert(campaign_data).execute()
		
		return JSONResponse(
			status_code=201,
			content={
				"success": True,
				"campaign": insert_result.data[0] if insert_result.data else None,
			},
		)
	except HTTPException:
		raise
	except Exception as exc:
		raise HTTPException(status_code=500, detail=str(exc))


@app.put("/campaigns/{campaign_id}")
def update_campaign(
	campaign_id: str,
	payload: CampaignPayload,
	tenant_id: int = Depends(get_current_tenant_id)
) -> JSONResponse:
	"""Update an existing campaign."""
	try:
		supabase = get_supabase_client()
		campaign_data = payload.dict(exclude_unset=True)
		
		update_result = supabase.schema("public").table("app_campaigns").update(campaign_data).eq("tenant_id", tenant_id).eq("campaign_id", campaign_id).execute()
		
		if not update_result.data:
			raise HTTPException(status_code=404, detail="Campaign not found or not owned by tenant")
			
		return JSONResponse(
			status_code=200,
			content={
				"success": True,
				"campaign": update_result.data[0],
			},
		)
	except HTTPException:
		raise
	except Exception as exc:
		raise HTTPException(status_code=500, detail=str(exc))


@app.delete("/campaigns/{campaign_id}")
def delete_campaign(
	campaign_id: str,
	tenant_id: int = Depends(get_current_tenant_id)
) -> JSONResponse:
	"""Delete an existing campaign."""
	try:
		supabase = get_supabase_client()
		delete_result = supabase.schema("public").table("app_campaigns").delete().eq("tenant_id", tenant_id).eq("campaign_id", campaign_id).execute()
		
		if not delete_result.data:
			raise HTTPException(status_code=404, detail="Campaign not found or not owned by tenant")
			
		return JSONResponse(
			status_code=200,
			content={
				"success": True,
				"message": "Campaign deleted successfully"
			},
		)
	except HTTPException:
		raise
	except Exception as exc:
		raise HTTPException(status_code=500, detail=str(exc))



if __name__ == "__main__":
    import uvicorn
    uvicorn.run("view_orders:app", port=8000, reload=True)
