import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../shared/lib/supabase';
/**
 * Hook to summarize instructor payouts (paid vs pending etc.)
 * Uses view: class_assignment_financials (has final_payment_amount, payment_status)
 * Falls back to instructor_upcoming_classes_v if first query fails (permissions difference).
 */
export function usePayoutSummary(instructorId, initialFilters) {
    const [summaries, setSummaries] = useState([]);
    const [totalFinalAmount, setTotalFinalAmount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState(() => {
        const now = new Date();
        const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const sixtyDays = new Date(Date.now() + 1000 * 60 * 60 * 24 * 60);
        return {
            from: startMonth,
            to: sixtyDays,
            ...(initialFilters || {})
        };
    });
    const fmt = (d) => d.toISOString().split('T')[0];
    const load = useCallback(async () => {
        if (!instructorId) {
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            setError(null);
            const fromDate = filters.from ? fmt(filters.from) : fmt(new Date());
            const toDate = filters.to ? fmt(filters.to) : fmt(new Date(Date.now() + 1000 * 60 * 60 * 24 * 60));
            // Primary query: class_assignment_financials
            let { data, error: qErr } = await supabase
                .from('class_assignment_financials')
                .select('id,instructor_id,payment_status,final_payment_amount,date')
                .eq('instructor_id', instructorId)
                .gte('date', fromDate)
                .lte('date', toDate);
            // Fallback if view not accessible
            if (qErr) {
                console.warn('Falling back to instructor_upcoming_classes_v due to error:', qErr.message);
                const fallback = await supabase
                    .from('instructor_upcoming_classes_v')
                    .select('assignment_id: id, instructor_id, payment_status, final_payment_amount, date')
                    .eq('instructor_id', instructorId)
                    .gte('date', fromDate)
                    .lte('date', toDate);
                data = fallback.data;
                if (fallback.error) {
                    throw fallback.error;
                }
            }
            const map = new Map();
            let total = 0;
            (data || []).forEach(row => {
                const status = row.payment_status || 'pending';
                const amount = Number(row.final_payment_amount) || 0;
                total += amount;
                if (!map.has(status)) {
                    map.set(status, { total: 0, count: 0 });
                }
                const bucket = map.get(status);
                bucket.total += amount;
                bucket.count += 1;
            });
            const summary = Array.from(map.entries()).map(([payment_status, value]) => ({
                payment_status,
                total_amount: parseFloat(value.total.toFixed(2)),
                class_count: value.count
            }));
            // Ensure consistent ordering: paid first, pending next, others after
            const ordering = ['paid', 'pending', 'approved', 'withheld', 'reversed'];
            summary.sort((a, b) => ordering.indexOf(a.payment_status) - ordering.indexOf(b.payment_status));
            setSummaries(summary);
            setTotalFinalAmount(parseFloat(total.toFixed(2)));
        }
        catch (e) {
            setError(e.message || 'Failed to load payout summary');
        }
        finally {
            setLoading(false);
        }
    }, [instructorId, filters]);
    useEffect(() => {
        load();
    }, [load]);
    const updateFilters = (partial) => {
        setFilters(prev => ({ ...prev, ...partial }));
    };
    const getByStatus = (status) => summaries.find(s => s.payment_status === status);
    const totalByStatuses = (statuses) => summaries
        .filter(s => statuses.includes(s.payment_status))
        .reduce((acc, s) => acc + s.total_amount, 0);
    return {
        summaries,
        totalFinalAmount,
        loading,
        error,
        filters,
        setFilters: updateFilters,
        refetch: load,
        getByStatus,
        totalByStatuses
    };
}
