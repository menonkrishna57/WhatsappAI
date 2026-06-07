import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from './auth';
import ProductsSection from './ProductsSection';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

function formatPaymentList(payments) {
  if (!Array.isArray(payments) || payments.length === 0) {
    return 'No linked payments';
  }
  return payments.join(', ');
}

function formatMoney(value) {
  const number = Number(value);
  if (Number.isNaN(number)) {
    return value ?? '-';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(number);
}

export default function DashboardPage() {
  const { user, tenantId, accessToken, signOut } = useAuth();
  
  const [activeTab, setActiveTab] = useState('orders'); // orders, payments, products, settings
  
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  
  const [settingsFormData, setSettingsFormData] = useState({
    business_name: '',
    whatsapp_number: '',
    ai_tone: '',
    currency: '',
    google_business_id: ''
  });
  const [serverStatus, setServerStatus] = useState('Checking API health...');
  const [status, setStatus] = useState('Idle');
  const [error, setError] = useState('');
  
  const [saving, setSaving] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(false);

  async function requestJson(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        ...(options.headers || {})
      },
      ...options
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = payload?.detail || payload?.message || 'Request failed';
      throw new Error(message);
    }

    return payload;
  }

  useEffect(() => {
    let cancelled = false;

    async function checkHealth() {
      try {
        const data = await requestJson('/health');
        if (cancelled) return;

        const supabaseStatus = data?.supabase?.status;
        const apiMessage = data?.status || 'ok';
        setServerStatus(
          supabaseStatus === 'connected'
            ? `API online, Supabase connected (${apiMessage})`
            : `API online, Supabase status: ${supabaseStatus || 'unknown'}`
        );
      } catch (err) {
        if (cancelled) return;
        setServerStatus(`API offline: ${err.message}`);
      }
    }

    if (accessToken) {
        checkHealth();
    }

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  useEffect(() => {
    if (!tenantId) {
      setOrders([]);
      setPayments([]);
      setStatus('Waiting for tenant context...');
      return;
    }

    // Auto-load on mount/tenant change
    loadOrders();
    loadPayments();
  }, [tenantId]);

  const orderCount = orders.length;
  const paymentCount = payments.length;

  async function loadOrders() {
    if (!tenantId) return;
    setError('');
    setLoadingOrders(true);
    setStatus(`Loading orders...`);

    try {
      const data = await requestJson(`/orders`);
      setOrders(Array.isArray(data.orders) ? data.orders : []);
      setStatus(`Loaded ${data.count ?? data.orders?.length ?? 0} orders`);
    } catch (err) {
      setError(err.message);
      setStatus('Failed to load orders');
    } finally {
      setLoadingOrders(false);
    }
  }

  async function loadPayments() {
    if (!tenantId) return;
    setError('');
    setLoadingPayments(true);
    setStatus(`Loading payments...`);

    try {
      const data = await requestJson(`/payments`);
      setPayments(Array.isArray(data.payments) ? data.payments : []);
      setStatus(`Loaded ${data.count ?? data.payments?.length ?? 0} payments`);
    } catch (err) {
      setError(err.message);
      setStatus('Failed to load payments');
    } finally {
      setLoadingPayments(false);
    }
  }

  async function loadSettings() {
    if (!tenantId) return;
    try {
      const data = await requestJson('/settings');
      if (data.settings) {
        setSettingsFormData({
          business_name: data.settings.business_name || '',
          whatsapp_number: data.settings.whatsapp_number || '',
          ai_tone: data.settings.ai_tone || '',
          currency: data.settings.currency || '',
          google_business_id: data.settings.google_business_id || ''
        });
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  }

  useEffect(() => {
    if (tenantId) {
      loadSettings();
    }
  }, [tenantId]);

  const handleSettingChange = (e) => {
    const { name, value } = e.target;
    setSettingsFormData(prev => ({ ...prev, [name]: value }));
  };

  async function saveSettings(event) {
    event.preventDefault();
    setError('');

    if (!settingsFormData.business_name.trim()) {
      setError('Business Name is required');
      return;
    }

    setSaving(true);
    setStatus('Saving settings...');

    try {
      const data = await requestJson('/settings', {
        method: 'PUT',
        body: JSON.stringify(settingsFormData)
      });

      setStatus(data.message || 'Settings saved successfully');
    } catch (err) {
      setError(err.message);
      setStatus('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'orders':
        return (
          <article className="panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2>Orders</h2>
              <button className="secondary-btn" onClick={loadOrders} disabled={loadingOrders}>
                {loadingOrders ? 'Loading...' : 'Refresh Orders'}
              </button>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Created</th>
                    <th>Payments</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="empty-state">
                        No orders found.
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr key={order.order_id}>
                        <td>{order.order_id}</td>
                        <td>{order.customer_id}</td>
                        <td>{new Date(order.created_at).toLocaleString()}</td>
                        <td>{formatPaymentList(order.payments)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </article>
        );
      case 'payments':
        return (
          <article className="panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2>Payments</h2>
              <button className="secondary-btn" onClick={loadPayments} disabled={loadingPayments}>
                {loadingPayments ? 'Loading...' : 'Refresh Payments'}
              </button>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Payment ID</th>
                    <th>Status</th>
                    <th>Amount</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="empty-state">
                        No payments found.
                      </td>
                    </tr>
                  ) : (
                    payments.map((payment, index) => (
                      <tr key={payment.payment_id ?? payment.id ?? index}>
                        <td>{payment.payment_id ?? payment.id ?? '-'}</td>
                        <td>{payment.status ?? payment.payment_status ?? '-'}</td>
                        <td>{formatMoney(payment.amount ?? payment.total_amount ?? payment.value ?? (payment.amount_cents ? payment.amount_cents / 100 : 0))}</td>
                        <td>{payment.created_at ? new Date(payment.created_at).toLocaleString() : '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </article>
        );
      case 'products':
        return (
          <article className="panel">
            <ProductsSection />
          </article>
        );
      case 'settings':
        return (
          <article className="panel" style={{ maxWidth: '600px' }}>
            <h2>Business Settings</h2>
            <form onSubmit={saveSettings} className="stacked-form" style={{ marginTop: '24px' }}>
              <label>
                Business Name *
                <input
                  name="business_name"
                  value={settingsFormData.business_name}
                  onChange={handleSettingChange}
                  required
                />
              </label>
              <div className="grid-two">
                <label>
                  WhatsApp Number
                  <input
                    name="whatsapp_number"
                    value={settingsFormData.whatsapp_number}
                    onChange={handleSettingChange}
                    placeholder="+1234567890"
                  />
                </label>
                <label>
                  Currency
                  <input
                    name="currency"
                    value={settingsFormData.currency}
                    onChange={handleSettingChange}
                    placeholder="₹"
                  />
                </label>
              </div>
              <label>
                AI Tone
                <input
                  name="ai_tone"
                  value={settingsFormData.ai_tone}
                  onChange={handleSettingChange}
                  placeholder="friendly, professional, etc."
                />
              </label>
              <label>
                Google Business ID
                <input
                  name="google_business_id"
                  value={settingsFormData.google_business_id}
                  onChange={handleSettingChange}
                  placeholder="123456789012345"
                />
              </label>
              <button className="primary-btn" type="submit" disabled={saving} style={{ marginTop: '16px' }}>
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </form>
          </article>
        );
      default:
        return null;
    }
  };

  return (
    <div className="app-shell demo-shell">
      <header className="demo-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <p className="eyebrow eyebrow-demo">WhatsAppAI Dashboard</p>
          <h1>Manage your business seamlessly.</h1>
          <p className="hero-copy">
            Orders, payments, and product catalog in one place.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
          <div style={{ background: '#e9f2ec', padding: '8px 16px', borderRadius: '20px', color: '#075e54', fontWeight: '600', fontSize: '0.9em' }}>
            {user?.email}
          </div>
          <button className="secondary-btn" onClick={signOut} style={{ padding: '6px 12px', fontSize: '0.9em' }}>
            Sign Out
          </button>
        </div>
      </header>

      <section className="status-strip panel">
        <div>
          <span className="status-label">API</span>
          <strong>{API_BASE_URL}</strong>
        </div>
        <div>
          <span className="status-label">Tenant ID</span>
          <strong>{tenantId || 'Loading...'}</strong>
          
          {!tenantId && (
            <button 
              className="primary-btn" 
              style={{ marginLeft: '12px', padding: '4px 8px', fontSize: '0.8em', background: '#eab308', color: 'black' }}
              onClick={async () => {
                try {
                  setStatus('Running emergency fix...');
                  // Create a new tenant row
                  const { data, error } = await supabase.from('app_tenants').insert([{ business_name: 'Emergency Fix Business', active: true }]).select('tenant_id');
                  if (error) throw error;
                  
                  const newId = data[0].tenant_id;
                  
                  // Force update metadata
                  const { error: updateErr } = await supabase.auth.updateUser({ data: { tenant_id: newId } });
                  if (updateErr) throw updateErr;
                  
                  await supabase.auth.refreshSession();
                  alert('Fixed! Your dashboard will now unlock.');
                  window.location.reload();
                } catch (err) {
                  alert('Emergency fix failed: ' + err.message);
                }
              }}
            >
              Emergency Fix Account
            </button>
          )}

          <div style={{fontSize: '11px', background: '#f0f0f0', padding: '4px', marginTop: '4px', maxWidth: '300px', overflow: 'auto'}}>
            RAW METADATA: {JSON.stringify(user?.user_metadata)}
          </div>
        </div>
        <div>
          <span className="status-muted">{serverStatus}</span>
          <span className="status-muted">{status}</span>
        </div>
        {error ? <span className="status-error">{error}</span> : null}
      </section>

      <section style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', borderBottom: '2px solid #e9f2ec', paddingBottom: '12px' }}>
          <button 
            onClick={() => setActiveTab('orders')}
            style={{ background: 'none', border: 'none', fontWeight: activeTab === 'orders' ? 'bold' : 'normal', color: activeTab === 'orders' ? '#075e54' : '#667781', fontSize: '1.1em' }}>
            Orders ({orderCount})
          </button>
          <button 
            onClick={() => setActiveTab('payments')}
            style={{ background: 'none', border: 'none', fontWeight: activeTab === 'payments' ? 'bold' : 'normal', color: activeTab === 'payments' ? '#075e54' : '#667781', fontSize: '1.1em' }}>
            Payments ({paymentCount})
          </button>
          <button 
            onClick={() => setActiveTab('products')}
            style={{ background: 'none', border: 'none', fontWeight: activeTab === 'products' ? 'bold' : 'normal', color: activeTab === 'products' ? '#075e54' : '#667781', fontSize: '1.1em' }}>
            Products
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            style={{ background: 'none', border: 'none', fontWeight: activeTab === 'settings' ? 'bold' : 'normal', color: activeTab === 'settings' ? '#075e54' : '#667781', fontSize: '1.1em' }}>
            Settings
          </button>
        </div>
      </section>

      {renderTabContent()}
    </div>
  );
}
