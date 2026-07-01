import React, { useEffect, useMemo, useState } from 'react';
import { Search, Pencil, MoreHorizontal, Check } from 'lucide-react';
import { useAuth } from './AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

// Used only if GET /customers is unreachable, so the page still renders
// something useful. Shape matches the real app_customers table.
const MOCK_CUSTOMERS = [
  {
    customer_id: '1',
    name: 'Neha Patel',
    phone: '+919876543210',
    tag: 'repeat_customer',
    total_orders: 8,
    total_spent_cents: 1245000,
    last_interaction: '2025-05-14T10:30:00Z',
    preferred_language: 'en',
    address: 'Mumbai, India',
    notes: 'Prefers evening appointments.',
  },
  {
    customer_id: '2',
    name: 'Rahul Sharma',
    phone: '+919123456789',
    tag: 'new',
    total_orders: 1,
    total_spent_cents: 32000,
    last_interaction: '2025-05-10T18:15:00Z',
    preferred_language: 'en',
    address: 'Pune, India',
    notes: '',
  },
];

const TAG_STYLES = {
  repeat_customer: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
  new: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  unpaid_customer: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
  inactive_customer: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
  no_offers: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
};

function tagLabel(tag) {
  if (!tag) return 'Unknown';
  return tag.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function initials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// Customers haven't explicitly agreed to share their number with the
// business owner's staff -- the AI/messaging layer handles actually
// sending WhatsApp messages, staff only see a masked version.
function maskPhone(phone) {
  if (!phone) return '—';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '•'.repeat(digits.length);
  const visible = digits.slice(-2);
  return `${phone.slice(0, phone.indexOf(digits))}${'•'.repeat(digits.length - 2)}${visible}`;
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

function useCustomers() {
  const { accessToken } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;

    async function fetchCustomers() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/customers`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) throw new Error('Failed to load customers');
        const data = await res.json();
        setCustomers(data.customers || []);
        setUsingFallback(false);
      } catch (err) {
        if (!cancelled) {
          setCustomers(MOCK_CUSTOMERS);
          setUsingFallback(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchCustomers();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  async function saveNotes(customerId, notes) {
    setCustomers((prev) => prev.map((c) => (c.customer_id === customerId ? { ...c, notes } : c)));
    try {
      const res = await fetch(`${API_BASE_URL}/customers/${customerId}/notes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) throw new Error('Failed to save note');
      return true;
    } catch (err) {
      // Backend/column may not exist yet -- keep the optimistic update so
      // the UI still feels responsive locally.
      return false;
    }
  }

  return { customers, loading, usingFallback, saveNotes };
}

function Avatar({ name, size = 'w-10 h-10', textSize = 'text-sm' }) {
  return (
    <div className={`${size} rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 flex items-center justify-center font-semibold ${textSize} shrink-0`}>
      {initials(name)}
    </div>
  );
}

function OverviewTab({ customer }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-5 space-y-4">
        <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm">About</h4>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">Phone</dt>
            <dd className="font-medium text-gray-900 dark:text-gray-100">{maskPhone(customer.phone)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">Address</dt>
            <dd className="font-medium text-gray-900 dark:text-gray-100 text-right">{customer.address || '—'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">Preferred language</dt>
            <dd className="font-medium text-gray-900 dark:text-gray-100">{(customer.preferred_language || 'en').toUpperCase()}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">Last interaction</dt>
            <dd className="font-medium text-gray-900 dark:text-gray-100">{formatDate(customer.last_interaction)}</dd>
          </div>
          <div className="flex justify-between items-center">
            <dt className="text-gray-500 dark:text-gray-400">Tag</dt>
            <dd>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${TAG_STYLES[customer.tag] || 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                {tagLabel(customer.tag)}
              </span>
            </dd>
          </div>
        </dl>
      </div>

      <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-5 space-y-4">
        <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm">Stats</h4>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">Total orders</dt>
            <dd className="font-bold text-gray-900 dark:text-gray-100">{customer.total_orders ?? 0}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">Total spent</dt>
            <dd className="font-bold text-gray-900 dark:text-gray-100">
              ₹{((customer.total_spent_cents ?? 0) / 100).toLocaleString('en-IN')}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

function NotesTab({ customer, onSaveNote }) {
  const [draft, setDraft] = useState(customer.notes || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDraft(customer.notes || '');
    setSaved(false);
  }, [customer.customer_id]);

  async function handleSave() {
    setSaving(true);
    await onSaveNote(customer.customer_id, draft);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-3">
      <textarea
        className="w-full h-40 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 p-4 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-500 resize-none"
        placeholder="Add a note about this customer..."
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
      />
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          {saving ? 'Saving...' : 'Save Note'}
        </button>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400 font-medium">
            <Check size={14} /> Saved
          </span>
        )}
      </div>
    </div>
  );
}

const TABS = [
  { id: 'overview', label: 'Overview', Component: OverviewTab },
  { id: 'notes', label: 'Notes', Component: NotesTab },
];

export default function CustomersPage() {
  const { customers, loading, usingFallback, saveNotes } = useCustomers();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!selectedId && customers.length) {
      setSelectedId(customers[0].customer_id);
    }
  }, [customers, selectedId]);

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(
      (c) => (c.name || '').toLowerCase().includes(q) || (c.phone || '').replace(/\s/g, '').includes(q.replace(/\s/g, ''))
    );
  }, [customers, search]);

  const selected = customers.find((c) => c.customer_id === selectedId) || null;

  async function handleSaveNote(customerId, notes) {
    await saveNotes(customerId, notes);
  }

  const ActiveTabComponent = TABS.find((t) => t.id === activeTab)?.Component;

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Customers</h2>
        {usingFallback && (
          <span className="bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 text-xs font-semibold px-2.5 py-0.5 rounded border border-yellow-200 dark:border-yellow-800">
            Mock Data
          </span>
        )}
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 min-h-0">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col min-h-0">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customers..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-500"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading && !customers.length ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-50 dark:bg-gray-900 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-10">No customers found.</p>
            ) : (
              filtered.map((customer) => (
                <button
                  key={customer.customer_id}
                  onClick={() => {
                    setSelectedId(customer.customer_id);
                    setActiveTab('overview');
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    selectedId === customer.customer_id
                      ? 'bg-green-50 dark:bg-green-950/40'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Avatar name={customer.name} />
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">{customer.name || 'Unnamed'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{maskPhone(customer.phone)}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col min-h-0">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
              {loading ? 'Loading customers...' : 'Select a customer to view details'}
            </div>
          ) : (
            <>
              <div className="p-6 flex items-center justify-between border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-4">
                  <Avatar name={selected.name} size="w-14 h-14" textSize="text-lg" />
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">{selected.name || 'Unnamed'}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{selected.address || 'No address on file'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2 transition-colors">
                    <Pencil size={14} /> Edit
                  </button>
                  <button className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 px-2">
                    <MoreHorizontal size={18} />
                  </button>
                </div>
              </div>

              <div className="px-6 pt-3 border-b border-gray-100 dark:border-gray-700 flex gap-6">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-green-600 text-green-700 dark:text-green-400'
                        : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {activeTab === 'notes' ? (
                  <NotesTab customer={selected} onSaveNote={handleSaveNote} />
                ) : (
                  ActiveTabComponent && <ActiveTabComponent customer={selected} />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
