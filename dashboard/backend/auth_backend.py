import os
from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client

_bearer = HTTPBearer()

def get_current_token(
    creds: HTTPAuthorizationCredentials = Security(_bearer)
) -> str:
    """Return the raw JWT token."""
    return creds.credentials

_anon_client: Client | None = None

def get_anon_client() -> Client:
    global _anon_client
    if _anon_client is None:
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_KEY")
        if not supabase_url or not supabase_key:
            raise HTTPException(status_code=500, detail="Supabase env vars missing")
        _anon_client = create_client(supabase_url, supabase_key)
    return _anon_client

def get_current_tenant_id(
    creds: HTTPAuthorizationCredentials = Security(_bearer)
) -> int:
    """Verify JWT, return tenant_id (int) embedded in user metadata."""
    token = creds.credentials
    supabase = get_anon_client()
    
    try:
        user_resp = supabase.auth.get_user(token)
    except Exception as e:
        err_str = str(e).lower()
        if "session" in err_str and ("not exist" in err_str or "expired" in err_str):
            # This happens when another device logs into the same account,
            # invalidating the current session token.
            raise HTTPException(
                status_code=401,
                detail="Your session has expired or was signed in from another device. Please log in again."
            )
        raise HTTPException(status_code=401, detail="Invalid or expired authentication token. Please log in again.")
        
    if not user_resp.user:
        raise HTTPException(status_code=401, detail="Invalid token")
        
    user_metadata = user_resp.user.user_metadata
    tenant_id = user_metadata.get("tenant_id")
    
    if tenant_id is None:
        raise HTTPException(status_code=403, detail="No tenant associated with this user")
        
    return int(tenant_id)
