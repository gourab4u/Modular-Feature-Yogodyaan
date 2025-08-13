import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../shared/lib/supabase';
/**
 * useAssignmentRoster
 * Derives expected attendees for an assignment via:
 * class_assignments (id) ->
 * assignment_bookings (assignment_id, booking_id) ->
 * bookings (booking_id, user_id, first_name, last_name, email) LEFT JOIN class_attendance
 *
 * Assumptions:
 * - Each booking row corresponds to exactly one member (user_id).
 * - class_attendance rows created lazily when attendance is marked (so LEFT JOIN).
 */
export function useAssignmentRoster(assignmentId, opts = {}) {
    const { enabled = true, autoReloadMs } = opts;
    const [attendees, setAttendees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const fetchRoster = useCallback(async () => {
        if (!assignmentId || !enabled)
            return;
        setLoading(true);
        setError(null);
        /**
         * We perform a single query using PostgREST RPC simulation:
         * SELECT ab.assignment_id, b.booking_id, b.user_id, b.first_name, b.last_name, b.email,
         *        ca.status, ca.notes, ca.marked_at
         *   FROM assignment_bookings ab
         *   JOIN bookings b ON b.booking_id = ab.booking_id
         *   LEFT JOIN class_attendance ca ON ca.assignment_id = ab.assignment_id AND ca.member_id = b.user_id
         *  WHERE ab.assignment_id = :assignmentId;
         */
        const { data, error } = await supabase
            .from('assignment_bookings_view_roster') // optional materialized/view naming fallback
            .select('*')
            .eq('assignment_id', assignmentId);
        // If the view does not exist, fallback to manual query via RPC (recommended to create)
        if (error) {
            // Attempt direct table join via postgrest (cannot express joins directly unless foreign tables exposed)
            // Fallback: call RPC if created; else surface error instructions.
            setError('Roster view not found. Create view or RPC (see instructions).');
            setLoading(false);
            return;
        }
        const mapped = (data || []).map((r) => ({
            member_id: r.user_id || r.member_id, // unify
            name: r.full_name || [r.first_name, r.last_name].filter(Boolean).join(' ') || 'Member',
            email: r.email,
            booking_id: r.booking_id,
            attendance_status: r.status ?? null,
            attendance_notes: r.notes ?? null,
            marked_at: r.marked_at ?? null
        }));
        setAttendees(mapped);
        setLoading(false);
    }, [assignmentId, enabled]);
    useEffect(() => {
        fetchRoster();
    }, [fetchRoster]);
    useEffect(() => {
        if (!autoReloadMs)
            return;
        const id = setInterval(fetchRoster, autoReloadMs);
        return () => clearInterval(id);
    }, [autoReloadMs, fetchRoster]);
    return {
        attendees,
        loading,
        error,
        refetch: fetchRoster
    };
}
/**
 * SQL helper (create a view matching the query this hook expects):
 *
 * CREATE OR REPLACE VIEW public.assignment_bookings_view_roster AS
 * SELECT
 *   ab.assignment_id,
 *   b.booking_id,
 *   b.user_id,
 *   (b.first_name || ' ' || b.last_name) AS full_name,
 *   b.email,
 *   ca.status,
 *   ca.notes,
 *   ca.marked_at
 * FROM public.assignment_bookings ab
 * JOIN public.bookings b ON b.booking_id = ab.booking_id
 * LEFT JOIN public.class_attendance ca
 *   ON ca.assignment_id = ab.assignment_id
 *  AND ca.member_id = b.user_id;
 *
 * GRANT SELECT ON public.assignment_bookings_view_roster TO authenticated;
 *
 * (Alternatively implement an RPC returning the same columns)
 */
