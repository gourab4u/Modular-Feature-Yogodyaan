import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../shared/lib/supabase';
import { ClassRating, RatingAggregate, UserRatingWithAggregate, isValidRating } from '../../../shared/types/ratings';

/**
 * Hook to manage current user's rating for a class assignment plus aggregate stats.
 * Relies on:
 *  - Table: class_ratings (RLS enforces permissions)
 *  - RPC: upsert_class_rating(p_assignment_id uuid, p_rating smallint, p_comment text)
 * Aggregate rating data (avg + count) may already be present in instructor_upcoming_classes_v,
 * but this hook can fetch standalone if needed.
 */
export function useClassRating(assignmentId?: string) {
    const [userRating, setUserRating] = useState<ClassRating | null>(null);
    const [aggregate, setAggregate] = useState<RatingAggregate | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [eligible, setEligible] = useState<boolean>(false); // whether user can submit/update (attendance + class ended)
    const [refreshIndex, setRefreshIndex] = useState<number>(0);

    // Determine eligibility by querying attendance + class end time check
    const evaluateEligibility = useCallback(async () => {
        if (!assignmentId) {
            setEligible(false);
            return;
        }
        try {
            // Pull class_assignments row (date, end_time, timezone) and attendance record
            // NOTE: If timezone handling is complex on server side we only do basic check here;
            // server / RLS will still enforce constraints.
            const { data: assignmentRow, error: assignmentErr } = await supabase
                .from('class_assignments')
                .select('id, date, end_time, timezone')
                .eq('id', assignmentId)
                .single();

            if (assignmentErr) throw assignmentErr;

            const { data: attRow, error: attErr } = await supabase
                .from('class_attendance')
                .select('status')
                .eq('assignment_id', assignmentId)
                .eq('member_id', (await supabase.auth.getUser()).data.user?.id)
                .single();

            // Attendance row may not exist yet (not attended).
            if (attErr && attErr.code !== 'PGRST116') {
                // PGRST116 = no rows found
                throw attErr;
            }

            // Basic client-side eligibility heuristic:
            // Must have attendance status in allowed list and estimated end-time passed.
            const allowedStatuses = ['present', 'late', 'makeup_completed'];
            const attendedOk = attRow && allowedStatuses.includes(attRow.status);

            let classEnded = false;
            if (assignmentRow?.date && assignmentRow?.end_time) {
                // Compose naive local timestamp (date + end_time) and compare (timezone not strictly applied here)
                const endTs = new Date(`${assignmentRow.date}T${assignmentRow.end_time}:00`);
                classEnded = Date.now() >= endTs.getTime();
            }

            setEligible(Boolean(attendedOk && classEnded));
        } catch (e: any) {
            // If eligibility check fails, keep false but don't hard fail whole hook
            console.warn('Eligibility evaluation failed:', e.message);
            setEligible(false);
        }
    }, [assignmentId]);

    const load = useCallback(async () => {
        if (!assignmentId) {
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            setError(null);

            // Current user ID
            const { data: userRes } = await supabase.auth.getUser();
            const userId = userRes.user?.id;
            if (!userId) {
                setUserRating(null);
            } else {
                const { data: ratingRow, error: ratingErr } = await supabase
                    .from('class_ratings')
                    .select('*')
                    .eq('assignment_id', assignmentId)
                    .eq('member_id', userId)
                    .maybeSingle();

                if (ratingErr) throw ratingErr;
                setUserRating(ratingRow as ClassRating || null);
            }

            // Aggregate (could rely on view, but we compute directly here)
            const { data: aggRows, error: aggErr } = await supabase
                .from('class_ratings')
                .select('rating')
                .eq('assignment_id', assignmentId);

            if (aggErr) throw aggErr;

            if (aggRows && aggRows.length > 0) {
                const sum = aggRows.reduce((acc, r: any) => acc + (r.rating || 0), 0);
                const count = aggRows.length;
                const avg = count ? sum / count : 0;
                setAggregate({
                    assignment_id: assignmentId,
                    avg_rating: parseFloat(avg.toFixed(2)),
                    rating_count: count
                });
            } else {
                setAggregate({
                    assignment_id: assignmentId,
                    avg_rating: 0,
                    rating_count: 0
                });
            }
        } catch (e: any) {
            setError(e.message || 'Failed to load ratings');
        } finally {
            setLoading(false);
        }
    }, [assignmentId]);

    useEffect(() => {
        load();
        evaluateEligibility();
    }, [load, evaluateEligibility, refreshIndex]);

    const submit = useCallback(async (rating: number, comment?: string | null) => {
        if (!assignmentId) throw new Error('assignmentId required');
        if (!isValidRating(rating)) throw new Error('Invalid rating value');
        if (!eligible) throw new Error('Not eligible to rate this class yet');

        try {
            setSubmitting(true);
            setError(null);

            const { data, error: rpcErr } = await supabase.rpc('upsert_class_rating', {
                p_assignment_id: assignmentId,
                p_rating: rating,
                p_comment: comment ?? null
            });

            if (rpcErr) throw rpcErr;

            // Refresh after submission
            setRefreshIndex(idx => idx + 1);
            return { id: data as string };
        } catch (e: any) {
            setError(e.message || 'Failed to submit rating');
            throw e;
        } finally {
            setSubmitting(false);
        }
    }, [assignmentId, eligible]);

    return {
        userRating,
        aggregate,
        loading,
        submitting,
        error,
        eligible,
        refresh: () => setRefreshIndex(idx => idx + 1),
        submit
    } as UserRatingWithAggregate & {
        loading: boolean;
        submitting: boolean;
        error: string | null;
        eligible: boolean;
        refresh: () => void;
        submit: (rating: number, comment?: string | null) => Promise<{ id: string }>;
    };
}
