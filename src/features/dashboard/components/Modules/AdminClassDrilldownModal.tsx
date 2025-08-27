import { Download, RefreshCw, X } from 'lucide-react';
import React, { useMemo } from 'react';
import { useAdminAssignmentRoster } from '../../hooks/useAdminClassOverview';

interface AdminClassDrilldownModalProps {
    open: boolean;
    onClose: () => void;
    assignmentId: string | null;
    meta?: {
        date?: string;
        start_time?: string;
        end_time?: string;
        class_status?: string;
        payment_status?: string | null;
        final_payment_amount?: number | null;
        attended_count?: number;
        absent_count?: number;
        no_show_count?: number;
        avg_rating?: number | null;
        ratings_submitted?: number;
    };
}

export const AdminClassDrilldownModal: React.FC<AdminClassDrilldownModalProps> = ({
    open,
    onClose,
    assignmentId,
    meta
}) => {
    const {
        roster,
        ratingSummary,
        loading,
        error,
        refetch
    } = useAdminAssignmentRoster(assignmentId || undefined);

    const exportRosterCsv = () => {
        if (!roster || roster.length === 0) return;
        const headers = [
            'assignment_id',
            'booking_id',
            'member_id',
            'full_name',
            'email',
            'attendance_status',
            'marked_at',
            'marked_by'
        ];
        const lines = [headers.join(',')];
        roster.forEach(r => {
            const row = [
                r.assignment_id,
                r.booking_id,
                r.member_id,
                JSON.stringify(r.full_name || ''),
                JSON.stringify(r.email || ''),
                r.status || '',
                r.marked_at || '',
                r.marked_by || ''
            ];
            lines.push(row.join(','));
        });
        const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `class_roster_${assignmentId}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const ratingDistBars = useMemo(() => {
        const total = ratingSummary.counts.reduce((acc, c) => acc + c.count, 0);
        if (total === 0) return null;
        return ratingSummary.counts.map(c => {
            const pct = total === 0 ? 0 : (c.count / total) * 100;
            return (
                <div key={c.rating} className="flex items-center gap-2 text-xs">
                    <span className="w-5 font-medium">{c.rating}★</span>
                    <div className="flex-1 h-2 rounded bg-gray-200 dark:bg-slate-700 overflow-hidden">
                        <div
                            className="h-full bg-amber-500 dark:bg-amber-400"
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                    <span className="w-8 text-right">{c.count}</span>
                </div>
            );
        });
    }, [ratingSummary]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[220] flex items-start justify-center p-4 md:items-center bg-black/40 backdrop-blur-sm overflow-y-auto"
            role="dialog"
            aria-modal="true"
        >
            <div className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 flex flex-col max-h-[95vh]">
                {/* Header */}
                <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-gray-200 dark:border-slate-700">
                    <div className="flex flex-col">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Class Drill-down
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-slate-400">
                            {assignmentId} • {meta?.date} {meta?.start_time}-{meta?.end_time}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => refetch()}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-600 flex items-center gap-1"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Reload
                        </button>
                        <button
                            onClick={exportRosterCsv}
                            disabled={!roster.length}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white flex items-center gap-1"
                        >
                            <Download className="w-3.5 h-3.5" />
                            CSV
                        </button>
                        <button
                            onClick={onClose}
                            className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-slate-400"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Meta Summary */}
                <div className="px-6 pt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-[11px]">
                    <div className="flex flex-col bg-gray-50 dark:bg-slate-800/60 rounded-lg p-3 border border-gray-200 dark:border-slate-700">
                        <span className="text-gray-500 dark:text-slate-400 uppercase tracking-wide">Status</span>
                        <span className="font-medium text-gray-900 dark:text-white">{meta?.class_status}</span>
                    </div>
                    <div className="flex flex-col bg-gray-50 dark:bg-slate-800/60 rounded-lg p-3 border border-gray-200 dark:border-slate-700">
                        <span className="text-gray-500 dark:text-slate-400 uppercase tracking-wide">Payment</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                            {meta?.payment_status || '—'} • ₹{(meta?.final_payment_amount ?? 0).toFixed(2)}
                        </span>
                    </div>
                    <div className="flex flex-col bg-gray-50 dark:bg-slate-800/60 rounded-lg p-3 border border-gray-200 dark:border-slate-700">
                        <span className="text-gray-500 dark:text-slate-400 uppercase tracking-wide">Attendance</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                            Present {meta?.attended_count ?? 0} • No Show {meta?.no_show_count ?? 0} • Absent {meta?.absent_count ?? 0}
                        </span>
                    </div>
                    <div className="flex flex-col bg-gray-50 dark:bg-slate-800/60 rounded-lg p-3 border border-gray-200 dark:border-slate-700">
                        <span className="text-gray-500 dark:text-slate-400 uppercase tracking-wide">Rating</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                            {(meta?.avg_rating ?? 0).toFixed(2)} ({meta?.ratings_submitted ?? 0})
                        </span>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-6">
                    {error && (
                        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 px-3 py-2 rounded-lg">
                            {error}
                        </div>
                    )}

                    {/* Rating distribution */}
                    <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 p-4">
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-200 mb-3">
                            Rating Distribution
                        </h3>
                        {ratingSummary.counts.every(c => c.count === 0) && (
                            <p className="text-xs text-gray-500 dark:text-slate-500">No ratings yet.</p>
                        )}
                        <div className="flex flex-col gap-1">
                            {ratingDistBars}
                        </div>
                        {ratingSummary.counts.some(c => c.count > 0) && (
                            <p className="mt-2 text-[11px] text-gray-500 dark:text-slate-500">
                                Average: {ratingSummary.avg.toFixed(2)}
                            </p>
                        )}
                    </div>

                    {/* Roster table */}
                    <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700">
                        <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-200">
                                Roster ({roster.length})
                            </h3>
                            {loading && (
                                <span className="text-[11px] text-gray-500 dark:text-slate-400">Loading…</span>
                            )}
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800 text-xs">
                                <thead className="bg-gray-50 dark:bg-slate-800/70">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-slate-300">#</th>
                                        <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-slate-300">Member</th>
                                        <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-slate-300">Email</th>
                                        <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-slate-300">Status</th>
                                        <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-slate-300">Marked At</th>
                                        <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-slate-300">Marked By</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-100 dark:divide-slate-800">
                                    {!loading && roster.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-slate-500">
                                                No roster rows.
                                            </td>
                                        </tr>
                                    )}
                                    {roster.map((r, idx) => (
                                        <tr key={r.booking_id} className="hover:bg-gray-50 dark:hover:bg-slate-800/60">
                                            <td className="px-3 py-2 text-gray-500 dark:text-slate-400 w-px">{idx + 1}</td>
                                            <td className="px-3 py-2">
                                                <span className="font-medium text-gray-800 dark:text-slate-100">{r.full_name || r.member_id}</span>
                                            </td>
                                            <td className="px-3 py-2 text-gray-600 dark:text-slate-400">{r.email || '—'}</td>
                                            <td className="px-3 py-2">
                                                <span className="px-2 py-1 rounded-full bg-gray-100 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-200">
                                                    {r.status || '—'}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 text-gray-600 dark:text-slate-400">
                                                {r.marked_at ? new Date(r.marked_at).toLocaleString() : '—'}
                                            </td>
                                            <td className="px-3 py-2 text-gray-600 dark:text-slate-400">
                                                {r.marked_by || '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between bg-gray-50 dark:bg-slate-800/40">
                    <span className="text-[11px] text-gray-500 dark:text-slate-400">
                        Data reflects current snapshot (auto/manual refresh).
                    </span>
                    <button
                        onClick={onClose}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
