import React, { useEffect, useMemo, useState } from 'react';
import { Plus, X, Target, Leaf, Repeat, Sparkles, Send, Loader2, Trash2 } from 'lucide-react';
import { useAuth } from './AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

function useCampaigns() {
  const { accessToken } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function fetchCampaigns() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/campaigns`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error('Failed to load campaigns');
      const data = await res.json();
      setCampaigns(data.campaigns || []);
    } catch (err) {
      setCampaigns([]);
      setError(err.message || 'Failed to fetch campaigns');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;

    async function doFetch() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/campaigns`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) throw new Error('Failed to load campaigns');
        const data = await res.json();
        if (!cancelled) setCampaigns(data.campaigns || []);
      } catch (err) {
        if (!cancelled) {
          setCampaigns([]);
          setError(err.message || 'Failed to fetch campaigns');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    doFetch();
    return () => { cancelled = true; };
  }, [accessToken]);

  async function createCampaign(payload) {
    try {
      const res = await fetch(`${API_BASE_URL}/campaigns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to create campaign');
      }
      await fetchCampaigns();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  async function deleteCampaign(campaignId) {
    try {
      const res = await fetch(`${API_BASE_URL}/campaigns/${campaignId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to delete campaign');
      }
      await fetchCampaigns();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  return { campaigns, loading, error, createCampaign, deleteCampaign };
}


const TABS = ['All', 'Broadcast', 'Promotions', 'Follow-ups'];

function StatusBadge({ status }) {
  const styles = {
    Delivered: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
    Scheduled: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
    Draft: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
    Failed: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
  };
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${styles[status] || styles.Draft}`}>{status}</span>;
}

function CreateCampaignModal({ open, onClose, onCreate }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '',
    type: 'Broadcast',
    message: '',
    audience: 'All Customers',
  });

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function reset() {
    setStep(1);
    setForm({ name: '', type: 'Broadcast', message: '', audience: 'All Customers' });
  }

  function handleClose() {
    reset();
    onClose();
  }

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate() {
    setSaving(true);
    setError('');
    
    const payload = {
      name: form.name || 'Untitled Campaign',
      description: form.message.slice(0, 60) || null,
      type: form.type,
      audience_count: 0,
      status: 'Scheduled',
      delivery_rate: 0,
      sent_on: new Date().toISOString()
    };
    
    const result = await onCreate(payload);
    setSaving(false);
    
    if (!result.ok) {
      setError(result.error);
      return;
    }
    
    handleClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={handleClose} />
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Create Campaign</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Step {step} of 2 · {step === 1 ? 'Campaign details' : 'Message & audience'}
            </p>
          </div>
          <button onClick={handleClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
            <X size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl px-4 py-2.5">
              {error}
            </div>
          )}
          {step === 1 ? (
            <>
              <label className="block">
                <span className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Campaign Name</span>
                <input
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-500"
                  placeholder="e.g. Monsoon Offer"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                />
              </label>
              <label className="block">
                <span className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Campaign Type</span>
                <div className="grid grid-cols-3 gap-2">
                  {['Broadcast', 'Promotions', 'Follow-up'].map((type) => (
                    <button
                      key={type}
                      onClick={() => update('type', type)}
                      className={`text-sm font-semibold rounded-xl py-2.5 border transition-colors ${
                        form.type === type
                          ? 'bg-green-50 dark:bg-green-950/40 border-green-500 text-green-700 dark:text-green-400'
                          : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </label>
            </>
          ) : (
            <>
              <label className="block">
                <span className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Audience</span>
                <select
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-500"
                  value={form.audience}
                  onChange={(e) => update('audience', e.target.value)}
                >
                  <option>All Customers</option>
                  <option>VIP Customers</option>
                  <option>Inactive Customers</option>
                  <option>New Customers</option>
                </select>
              </label>
              <label className="block">
                <span className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Message</span>
                <textarea
                  className="w-full h-32 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-500"
                  placeholder="Write your WhatsApp message..."
                  value={form.message}
                  onChange={(e) => update('message', e.target.value)}
                />
                <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">{form.message.length}/1000 characters</span>
              </label>
            </>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex gap-3">
          {step === 2 && (
            <button
              onClick={() => setStep(1)}
              className="flex-1 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-sm rounded-xl py-2.5 transition-colors"
            >
              Back
            </button>
          )}
          {step === 1 ? (
            <button
              onClick={() => setStep(2)}
              disabled={!form.name.trim()}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold text-sm rounded-xl py-2.5 transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={!form.message.trim() || saving}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold text-sm rounded-xl py-2.5 transition-colors"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? 'Creating...' : 'Create Campaign'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CampaignsPage() {
  const { campaigns, loading, error, createCampaign, deleteCampaign } = useCampaigns();
  const [activeTab, setActiveTab] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);

  async function handleDelete(campaignId) {
    if (window.confirm("Are you sure you want to delete this campaign?")) {
      const result = await deleteCampaign(campaignId);
      if (!result.ok) {
        alert(result.error);
      }
    }
  }

  const filtered = useMemo(() => {
    if (activeTab === 'All') return campaigns;
    if (activeTab === 'Follow-ups') return campaigns.filter((c) => c.type === 'Follow-up');
    return campaigns.filter((c) => c.type === activeTab.replace(/s$/, ''));
  }, [campaigns, activeTab]);

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Campaigns</h2>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus size={16} /> Create Campaign
        </button>
      </div>

      <div className="flex gap-6 border-b border-gray-100 dark:border-gray-700 px-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-green-600 text-green-700 dark:text-green-400'
                : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-50 dark:bg-gray-900 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="h-full flex items-center justify-center text-red-500 dark:text-red-400 text-sm">
              {error}
            </div>
          ) : filtered.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
              No campaigns in this category yet.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 dark:text-gray-500 text-xs font-semibold border-b border-gray-100 dark:border-gray-700">
                  <th className="px-6 py-3">Campaign</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Audience</th>
                  <th className="px-6 py-3">Sent</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Delivered</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  let Icon = Target;
                  let color = 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300';
                  if (c.type === 'Promotions') { Icon = Leaf; color = 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'; }
                  else if (c.type === 'Follow-up') { Icon = Repeat; color = 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'; }

                  const formattedDate = c.sent_on ? new Date(c.sent_on).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
                  
                  return (
                    <tr key={c.campaign_id} className="border-b border-gray-50 dark:border-gray-700/60 last:border-0 hover:bg-gray-50/60 dark:hover:bg-gray-700/40">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                            <Icon size={18} />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">{c.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{c.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{c.type}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{(c.audience_count || 0).toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{formattedDate}</td>
                      <td className="px-6 py-4"><StatusBadge status={c.status} /></td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{c.delivery_rate || 0}%</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleDelete(c.campaign_id)} className="text-gray-400 hover:text-red-500 transition-colors p-1" title="Delete Campaign">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <CreateCampaignModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={createCampaign}
      />
    </div>
  );
}
