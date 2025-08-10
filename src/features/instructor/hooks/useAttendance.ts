import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../../../shared/lib/supabase';
import { AttendanceRecord, AttendanceStatus } from '../../../shared/types/attendance';

interface UseAttendanceOptions {
    autoReloadIntervalMs?: number; // default 60s
}

interface UpsertAttendanceInput {
    member_id: string;
    status: AttendanceStatus;
    notes?: string | null;
}

interface UseAttendanceResult {
    records: AttendanceRecord[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    upsert: (input: UpsertAttendanceInput) => Promise<{ id: string }>;
    optimisticUpdating: boolean;
    lastUpdatedAt: string | null;
}

/**
 * Hook to manage attendance list + upserts for a class assignment.
 * Relies on RPC: upsert_attendance(p_assignment_id, p_member_id, p_status, p_notes)
 */
export function useAttendance(assignmentId?: string, opts?: UseAttendanceOptions): UseAttendanceResult {
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [optimisticUpdating, setOptimisticUpdating] = useState(false);
    const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
    const intervalRef = useRef<number | null>(null);

    const load = useCallback(async () => {
        if (!assignmentId) {
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            setError(null);
            const { data, error: qErr } = await supabase
                .from('class_attendance')
                .select('*')
                .eq('assignment_id', assignmentId)
                .order('status', { ascending: true })
                .order('member_id', { ascending: true });

            if (qErr) throw qErr;

            setRecords((data || []) as AttendanceRecord[]);
            setLastUpdatedAt(new Date().toISOString());
        } catch (e: any) {
            setError(e.message || 'Failed to load attendance');
        } finally {
            setLoading(false);
        }
    }, [assignmentId]);

    useEffect(() => {
        load();
    }, [load]);

    // Optional polling
    useEffect(() => {
        const ms = opts?.autoReloadIntervalMs ?? 60000;
        if (!assignmentId) return;
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = window.setInterval(() => {
            load();
        }, ms);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [assignmentId, load, opts?.autoReloadIntervalMs]);

    const upsert = useCallback(async (input: UpsertAttendanceInput) => {
        if (!assignmentId) throw new Error('assignmentId required');
        setOptimisticUpdating(true);

        // Optimistic snapshot
        const prev = records;
        const nowIso = new Date().toISOString();
        const existing = prev.find(r => r.member_id === input.member_id);

        const optimistic: AttendanceRecord = existing
            ? { ...existing, status: input.status, notes: input.notes ?? existing.notes, updated_at: nowIso, marked_at: nowIso }
            : {
                id: 'optimistic-' + crypto.randomUUID(),
                assignment_id: assignmentId,
                member_id: input.member_id,
                status: input.status,
                notes: input.notes ?? null,
                marked_by: 'optimistic',
                marked_at: nowIso,
                updated_at: nowIso,
                makeup_of_assignment_id: null
            };

        setRecords(prevRecs => {
            if (existing) {
                return prevRecs.map(r => (r.member_id === input.member_id ? optimistic : r));
            }
            return [...prevRecs, optimistic];
        });

        try {
            const { data, error: rpcErr } = await supabase.rpc('upsert_attendance', {
                p_assignment_id: assignmentId,
                p_member_id: input.member_id,
                p_status: input.status,
                p_notes: input.notes ?? null
            });

            if (rpcErr) throw rpcErr;

            // After success, reload authoritative row (single row query to minimize)
            const { data: rowData, error: rowErr } = await supabase
                .from('class_attendance')
                .select('*')
                .eq('id', data)
                .single();

            if (rowErr) throw rowErr;

            setRecords(prevRecs =>
                prevRecs
                    .map(r => (r.member_id === input.member_id ? (rowData as AttendanceRecord) : r))
                    // Remove duplicate optimistic IDs if both exist
                    .filter((r, idx, arr) =>
                        arr.findIndex(x => x.member_id === r.member_id) === idx
                    )
            );
            setLastUpdatedAt(new Date().toISOString());
            return { id: data as string };
        } catch (e: any) {
            // Rollback
            setRecords(prev);
            setError(e.message || 'Failed to update attendance');
            throw e;
        } finally {
            setOptimisticUpdating(false);
        }
    }, [assignmentId, records]);

    return { records, loading, error, refetch: load, upsert, optimisticUpdating, lastUpdatedAt };
}
