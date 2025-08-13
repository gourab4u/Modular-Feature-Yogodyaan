import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../../../shared/lib/supabase';
import { AdminClassOverview } from '../../../shared/types/assignments';

export interface AdminClassFilters {
    from?: Date | null;
    to?: Date | null;
    instructor_id?: string | 'all';
    class_status?: string | 'all';
    payment_status?: string | 'all';
    search?: string;
}

export interface RatingDistribution {
    rating: number;
    count: number;
}

interface UseAdminClassOverviewOptions {
    autoReloadMs?: number;
    limit?: number;
}

/**
 * Hook for admin/super_admin to retrieve class overview data with filters + rating distribution.
 * Depends on DB view: admin_class_overview_v
 * Optional supplemental query to class_ratings for distribution.
 */
export function useAdminClassOverview(filters: AdminClassFilters, opts: UseAdminClassOverviewOptions = {}) {
    const {
        autoReloadMs = 60000,
        limit = 1000
    } = opts;

    const [rows, setRows] = useState<AdminClassOverview[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [ratingDistribution, setRatingDistribution] = useState<RatingDistribution[]>([]);
    const pollingRef = useRef<number | null>(null);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            let query = supabase
                .from('admin_class_overview_v')
                .select('*')
                .order('date', { ascending: false })
                .order('start_time', { ascending: false });

            // Date filters
            if (filters.from) query = query.gte('date', filters.from.toISOString().split('T')[0]);
            if (filters.to) query = query.lte('date', filters.to.toISOString().split('T')[0]);

            if (filters.instructor_id && filters.instructor_id !== 'all') {
                query = query.eq('instructor_id', filters.instructor_id);
            }
            if (filters.class_status && filters.class_status !== 'all') {
                query = query.eq('class_status', filters.class_status);
            }
            if (filters.payment_status && filters.payment_status !== 'all') {
                query = query.eq('payment_status', filters.payment_status);
            }

            query = query.limit(limit);

            const { data, error: qErr } = await query;
            if (qErr) throw qErr;

            let list = (data || []) as AdminClassOverview[];

            // Client-side search on (avg_rating numeric or we can expand later for class_types.name)
            if (filters.search) {
                const s = filters.search.toLowerCase();
                list = list.filter(r =>
                    r.assignment_id.toLowerCase().includes(s) ||
                    (r.class_status || '').toLowerCase().includes(s)
                );
            }

            setRows(list);

            // Ratings distribution (aggregate all ratings across returned assignments)
            if (list.length > 0) {
                const ids = list.map(r => r.assignment_id);
                // Avoid excessive IN list by chunking (PostgREST limit ~ 200 items typical). We'll chunk by 150.
                const chunkSize = 150;
                const ratings: number[] = [];
                for (let i = 0; i < ids.length; i += chunkSize) {
                    const slice = ids.slice(i, i + chunkSize);
                    const { data: ratingRows, error: rErr } = await supabase
                        .from('class_ratings')
                        .select('rating,assignment_id')
                        .in('assignment_id', slice);
                    if (rErr) {
                        // Non-fatal
                        console.warn('Rating fetch chunk error', rErr);
                        continue;
                    }
                    (ratingRows || []).forEach(rr => {
                        if (typeof rr.rating === 'number') ratings.push(rr.rating);
                    });
                }
                const distMap = new Map<number, number>();
                ratings.forEach(r => distMap.set(r, (distMap.get(r) || 0) + 1));
                const dist: RatingDistribution[] = Array.from({ length: 5 }, (_, i) => {
                    const rating = i + 1;
                    return { rating, count: distMap.get(rating) || 0 };
                });
                setRatingDistribution(dist);
            } else {
                setRatingDistribution([]);
            }

        } catch (e: any) {
            setError(e.message || 'Failed to load admin class overview');
        } finally {
            setLoading(false);
        }
    }, [filters, limit]);

    useEffect(() => {
        load();
    }, [load]);

    // Polling
    useEffect(() => {
        if (!autoReloadMs) return;
        if (pollingRef.current) window.clearInterval(pollingRef.current);
        pollingRef.current = window.setInterval(() => {
            load();
        }, autoReloadMs);
        return () => {
            if (pollingRef.current) window.clearInterval(pollingRef.current);
        };
    }, [autoReloadMs, load]);

    const aggregates = useMemo(() => {
        const total = rows.length;
        const attendedTotal = rows.reduce((acc, r) => acc + (r.attended_count || 0), 0);
        const absentTotal = rows.reduce((acc, r) => acc + (r.absent_count || 0), 0);
        const noShowTotal = rows.reduce((acc, r) => acc + (r.no_show_count || 0), 0);
        const avgRatingOverall = (() => {
            const rated = rows.filter(r => (r.avg_rating ?? null) !== null && r.ratings_submitted > 0);
            if (rated.length === 0) return 0;
            // Weighted by number of ratings
            const sum = rated.reduce((acc, r) => acc + (r.avg_rating || 0) * r.ratings_submitted, 0);
            const denom = rated.reduce((acc, r) => acc + r.ratings_submitted, 0);
            return denom === 0 ? 0 : sum / denom;
        })();

        return {
            total_classes: total,
            attended_total: attendedTotal,
            absent_total: absentTotal,
            no_show_total: noShowTotal,
            avg_rating_overall: avgRatingOverall
        };
    }, [rows]);

    return {
        rows,
        loading,
        error,
        ratingDistribution,
        aggregates,
        refetch: load
    };
}

/**
 * Roster row type for admin drilldown (mirrors admin_assignment_roster_v)
 */
export interface AdminRosterRow {
    assignment_id: string;
    booking_id: string;
    member_id: string;
    full_name: string | null;
    email: string | null;
    status: string | null;
    marked_at: string | null;
    marked_by: string | null;
}

/**
 * Hook to load roster + ratings for a single assignment (admin drilldown)
 */
export function useAdminAssignmentRoster(assignmentId?: string) {
    const [roster, setRoster] = useState<AdminRosterRow[]>([]);
    const [ratings, setRatings] = useState<{ rating: number; member_id: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!assignmentId) return;
        try {
            setLoading(true);
            setError(null);
            const { data: rosterRows, error: rErr } = await supabase
                .from('admin_assignment_roster_v')
                .select('*')
                .eq('assignment_id', assignmentId);
            if (rErr) throw rErr;

            const { data: ratingRows, error: ratErr } = await supabase
                .from('class_ratings')
                .select('rating,member_id')
                .eq('assignment_id', assignmentId);
            if (ratErr) {
                console.warn('Rating fetch failed (non-fatal)', ratErr);
            }

            setRoster(rosterRows as AdminRosterRow[] || []);
            setRatings(ratingRows as any[] || []);
        } catch (e: any) {
            setError(e.message || 'Failed to load roster');
        } finally {
            setLoading(false);
        }
    }, [assignmentId]);

    useEffect(() => {
        load();
    }, [load]);

    const ratingSummary = useMemo(() => {
        if (ratings.length === 0) return { avg: 0, counts: [] as { rating: number; count: number }[] };
        const map = new Map<number, number>();
        ratings.forEach(r => map.set(r.rating, (map.get(r.rating) || 0) + 1));
        const counts: { rating: number; count: number }[] = [];
        for (let i = 1; i <= 5; i++) {
            counts.push({ rating: i, count: map.get(i) || 0 });
        }
        const weightedSum = counts.reduce((acc, c) => acc + c.rating * c.count, 0);
        const total = counts.reduce((acc, c) => acc + c.count, 0);
        return {
            avg: total === 0 ? 0 : weightedSum / total,
            counts
        };
    }, [ratings]);

    return {
        roster,
        ratings,
        ratingSummary,
        loading,
        error,
        refetch: load
    };
}
