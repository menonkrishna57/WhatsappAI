import React, { useEffect, useState } from 'react';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from './AuthContext';
import { useAnalyticsData } from './hooks/useAnalyticsData';
import StatCard from './StatCard';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

function useOpenEscalations() {
  const { accessToken } = useAuth();
  const [escalations, setEscalations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;

    async function fetchEscalations() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/escalations?status=open&limit=5`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) throw new Error('Failed to load escalations');
        const data = await res.json();
        if (!cancelled) setEscalations(data.escalations || []);
      } catch (err) {
        if (!cancelled) setEscalations([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchEscalations();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  return { escalations, loading };
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { revenue, customers, openEscalations, loading, usingFallback } = useAnalyticsData();
  const { escalations, loading: escalationsLoading } = useOpenEscalations();

  const firstName = user?.user_metadata?.business_name || user?.email?.split('@')[0] || 'there';

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Good morning, {firstName}</h2>
          <p className="text-gray-500 dark:text-gray-400">Here's what's happening with your business today.</p>
        </div>

      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard label="Revenue" value={revenue.value} loading={loading} />
        <StatCard label="Customers" value={customers.value} loading={loading} />
        <StatCard label="Open Escalations" value={openEscalations.value} loading={loading} />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <AlertCircle size={18} className="text-amber-500" />
            Needs Attention
          </h3>
        </div>
        {escalationsLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-14 bg-gray-50 dark:bg-gray-900 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : escalations.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">
            No open escalations. Your AI is handling everything on its own.
          </p>
        ) : (
          <div className="space-y-3">
            {escalations.map((e) => (
              <div
                key={e.escalation_id}
                className="flex items-start justify-between gap-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 rounded-xl px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{e.reason}</p>
                  {e.summary && <p className="text-gray-600 dark:text-gray-300 text-sm mt-0.5">{e.summary}</p>}
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{formatDate(e.created_at)}</p>
                </div>
                <ArrowRight size={16} className="text-amber-500 shrink-0 mt-1" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
