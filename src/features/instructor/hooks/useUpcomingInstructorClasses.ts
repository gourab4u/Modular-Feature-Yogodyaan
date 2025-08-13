import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../../../shared/lib/supabase';
import { ClassStatus, InstructorUpcomingAssignment, PaymentStatus } from '../../../shared/types/assignments';

/**
 * Filters passed into hook.
 */
export interface UpcomingClassFilters {
    from?: Date;                 // default: today
    to?: Date;                   // default: today + 60 days
    class_status?: ClassStatus | 'all';
    payment_status?: PaymentStatus | 'all';
    schedule_type?: string | 'all';
    search?: string;             // future (class name)
}

/**
 * Internal helper to format date to YYYY-MM-DD
 */
function fmt(d: Date): string {
    return d.toISOString().split('T')[0];
}

/**
 * Hook to load upcoming instructor classes (next 60 days window) from view:
 * instructor_upcoming_classes_v
 * RLS should restrict to instructor_id = auth.uid(), but we also apply explicit filter.
 */
export function useUpcomingInstructorClasses(instructorId?: string, initialFilters?: UpcomingClassFilters) {
    const [data, setData] = useState<InstructorUpcomingAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<UpcomingClassFilters>(() => ({
        from: new Date(),
        to: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60), // +60 days
        class_status: 'all',
        payment_status: 'all',
        schedule_type: 'all',
        ...(initialFilters || {})
    }));
    const pollingRef = useRef<number | null>(null);

    const load = useCallback(async () => {
        if (!instructorId) {
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            setError(null);

            let query = supabase
                .from('instructor_upcoming_classes_v')
                .select('*')
                .eq('instructor_id', instructorId);

            // Date window
            const fromDate = filters.from ? fmt(filters.from) : fmt(new Date());
            const toDate = filters.to ? fmt(filters.to) : fmt(new Date(Date.now() + 1000 * 60 * 60 * 24 * 60));
            query = query.gte('date', fromDate).lte('date', toDate);

            if (filters.class_status && filters.class_status !== 'all') {
                query = query.eq('class_status', filters.class_status);
            }
            if (filters.payment_status && filters.payment_status !== 'all') {
                query = query.eq('payment_status', filters.payment_status);
            }
            if (filters.schedule_type && filters.schedule_type !== 'all') {
                query = query.eq('schedule_type', filters.schedule_type);
            }

            const { data: rows, error: qErr } = await query.order('date', { ascending: true }).order('start_time', { ascending: true });

            if (qErr) throw qErr;

            // Basic client-side search (class_types.name when available)
            let finalRows = rows as InstructorUpcomingAssignment[] || [];
            if (filters.search) {
                const s = filters.search.toLowerCase();
                finalRows = finalRows.filter(r =>
                    (r as any).class_types?.name?.toLowerCase().includes(s)
                );
            }

            setData(finalRows);
        } catch (e: any) {
            setError(e.message || 'Failed to load upcoming classes');
        } finally {
            setLoading(false);
        }
    }, [instructorId, filters]);

    // Initial + filters reload
    useEffect(() => {
        load();
    }, [load]);

    // Poll every 60s (only while mounted)
    useEffect(() => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
        }
        pollingRef.current = window.setInterval(() => {
            load();
        }, 60000);
        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, [load]);

    const updateFilters = (partial: Partial<UpcomingClassFilters>) => {
        setFilters(prev => ({ ...prev, ...partial }));
    };

    return {
        classes: data,
        loading,
        error,
        filters,
        setFilters: updateFilters,
        refetch: load
    };
}
