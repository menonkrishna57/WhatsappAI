import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

function formatCurrency(amount, currency = '₹') {
  return `${currency}${Math.round(amount).toLocaleString('en-IN')}`;
}

/**
 * Every number here is backed by a real Supabase table:
 *  - revenue        <- app_payments (status = 'paid')
 *  - customers       <- app_customers
 *  - openEscalations <- app_escalations (status = 'open')
 *
 * There is intentionally no conversation volume, AI resolution rate, or
 * response time here -- those need a real messages/conversations table from
 * the WhatsApp integration, which doesn't exist yet. Add it back once that
 * table exists instead of mocking it.
 */
export function useAnalyticsData() {
  const { accessToken } = useAuth();
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [escalations, setEscalations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;

    async function fetchAll() {
      setLoading(true);
      setError('');
      try {
        const headers = { Authorization: `Bearer ${accessToken}` };
        const [paymentsRes, customersRes, escalationsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/payments`, { headers }),
          fetch(`${API_BASE_URL}/customers`, { headers }),
          fetch(`${API_BASE_URL}/escalations?status=open`, { headers }),
        ]);

        if (!paymentsRes.ok || !customersRes.ok) {
          throw new Error('Failed to load live metrics');
        }

        const paymentsData = await paymentsRes.json();
        const customersData = await customersRes.json();
        // Escalations endpoint is newer -- don't hard-fail the whole
        // dashboard if it 404s on a backend that hasn't been redeployed yet.
        const escalationsData = escalationsRes.ok ? await escalationsRes.json() : { escalations: [] };

        if (!cancelled) {
          setPayments(paymentsData.payments || []);
          setCustomers(customersData.customers || []);
          setEscalations(escalationsData.escalations || []);
          setUsingFallback(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setUsingFallback(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const metrics = useMemo(() => {
    if (usingFallback) {
      return {
        revenue: { value: formatCurrency(0) },
        customers: { value: 0 },
        openEscalations: { value: 0 },
      };
    }

    // Real app_payments.status defaults to 'pending'; only count 'paid' rows.
    const revenueTotal = payments
      .filter((p) => (p.status || '').toLowerCase() === 'paid')
      .reduce((sum, p) => sum + (p.amount_cents || 0) / 100, 0);

    return {
      revenue: { value: formatCurrency(revenueTotal) },
      customers: { value: customers.length },
      openEscalations: { value: escalations.length },
    };
  }, [payments, customers, escalations, usingFallback]);

  return { ...metrics, loading, error, usingFallback };
}
