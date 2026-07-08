import React, { useEffect, useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { useAuth } from './AuthContext';
import StatCard from './StatCard';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

function formatCurrency(amount) {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

function useRevenueAndEscalations() {
  const { accessToken } = useAuth();
  const [payments, setPayments] = useState([]);
  const [escalations, setEscalations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;

    async function fetchAll() {
      setLoading(true);
      try {
        const headers = { Authorization: `Bearer ${accessToken}` };
        const [paymentsRes, escalationsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/payments`, { headers }),
          fetch(`${API_BASE_URL}/escalations`, { headers }),
        ]);
        if (!paymentsRes.ok) throw new Error('Failed to load payments');

        const paymentsData = await paymentsRes.json();
        const escalationsData = escalationsRes.ok ? await escalationsRes.json() : { escalations: [] };

        if (!cancelled) {
          setPayments(paymentsData.payments || []);
          setEscalations(escalationsData.escalations || []);
          setUsingFallback(false);
        }
      } catch (err) {
        if (!cancelled) setUsingFallback(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  return { payments, escalations, loading, usingFallback };
}

// Groups paid payments by day, for the last `days` calendar days.
function buildRevenueSeries(payments, days = 14) {
  const today = new Date();
  const buckets = new Map();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    buckets.set(key, 0);
  }

  payments
    .filter((p) => (p.status || '').toLowerCase() === 'paid' && p.paid_at)
    .forEach((p) => {
      const key = new Date(p.paid_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      if (buckets.has(key)) {
        buckets.set(key, buckets.get(key) + (p.amount_cents || 0) / 100);
      }
    });

  return Array.from(buckets.entries()).map(([day, amount]) => ({ day, amount }));
}

function buildEscalationReasonBreakdown(escalations) {
  const counts = new Map();
  escalations.forEach((e) => {
    const key = e.reason || 'Other';
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return Array.from(counts.entries())
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

function RevenueTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 px-3 py-2 rounded-lg border border-gray-100 dark:border-gray-700 shadow-md text-sm">
      <p className="text-gray-500 dark:text-gray-400">{label}</p>
      <p className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

export default function AnalyticsPage() {
  const { payments, escalations, loading, usingFallback } = useRevenueAndEscalations();

  const revenueSeries = useMemo(() => buildRevenueSeries(payments), [payments]);
  const escalationBreakdown = useMemo(() => buildEscalationReasonBreakdown(escalations), [escalations]);

  const paidPayments = payments.filter((p) => (p.status || '').toLowerCase() === 'paid');
  const pendingPayments = payments.filter((p) => (p.status || '').toLowerCase() === 'pending');
  const totalRevenue = paidPayments.reduce((sum, p) => sum + (p.amount_cents || 0) / 100, 0);
  const pendingAmount = pendingPayments.reduce((sum, p) => sum + (p.amount_cents || 0) / 100, 0);

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Analytics</h2>

      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard label="Total Revenue (Paid)" value={formatCurrency(totalRevenue)} loading={loading} />
        <StatCard label="Pending Payments" value={formatCurrency(pendingAmount)} loading={loading} />
        <StatCard label="Total Escalations" value={escalations.length} loading={loading} />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
        <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Revenue, Last 14 Days</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={revenueSeries} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#16a34a" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#16a34a" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval={1} />
            <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip content={<RevenueTooltip />} />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="#16a34a"
              strokeWidth={2.5}
              fill="url(#revenueFill)"
              dot={false}
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
        <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Escalation Reasons</h3>
        {escalationBreakdown.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">No escalations recorded yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={escalationBreakdown} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="reason"
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                width={140}
              />
              <Tooltip />
              <Bar dataKey="count" fill="#16a34a" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
