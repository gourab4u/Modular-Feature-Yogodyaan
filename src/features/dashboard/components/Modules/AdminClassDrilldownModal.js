import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { Download, RefreshCw, X } from 'lucide-react';
import { useMemo } from 'react';
import { useAdminAssignmentRoster } from '../../hooks/useAdminClassOverview';
export const AdminClassDrilldownModal = ({ open, onClose, assignmentId, meta }) => {
    const { roster, ratingSummary, loading, error, refetch } = useAdminAssignmentRoster(assignmentId || undefined);
    const exportRosterCsv = () => {
        if (!roster || roster.length === 0)
            return;
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
        if (total === 0)
            return null;
        return ratingSummary.counts.map(c => {
            const pct = total === 0 ? 0 : (c.count / total) * 100;
            return (_jsxs("div", { className: "flex items-center gap-2 text-xs", children: [_jsxs("span", { className: "w-5 font-medium", children: [c.rating, "\u2605"] }), _jsx("div", { className: "flex-1 h-2 rounded bg-gray-200 dark:bg-slate-700 overflow-hidden", children: _jsx("div", { className: "h-full bg-amber-500 dark:bg-amber-400", style: { width: `${pct}%` } }) }), _jsx("span", { className: "w-8 text-right", children: c.count })] }, c.rating));
        });
    }, [ratingSummary]);
    if (!open)
        return null;
    return (_jsx("div", { className: "fixed inset-0 z-[220] flex items-start justify-center p-4 md:items-center bg-black/40 backdrop-blur-sm overflow-y-auto", role: "dialog", "aria-modal": "true", children: _jsxs("div", { className: "w-full max-w-5xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 flex flex-col max-h-[95vh]", children: [_jsxs("div", { className: "flex items-center justify-between gap-4 px-6 py-4 border-b border-gray-200 dark:border-slate-700", children: [_jsxs("div", { className: "flex flex-col", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: "Class Drill-down" }), _jsxs("p", { className: "text-xs text-gray-500 dark:text-slate-400", children: [assignmentId, " \u2022 ", meta?.date, " ", meta?.start_time, "-", meta?.end_time] })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs("button", { onClick: () => refetch(), className: "px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-600 flex items-center gap-1", children: [_jsx(RefreshCw, { className: "w-3.5 h-3.5" }), "Reload"] }), _jsxs("button", { onClick: exportRosterCsv, disabled: !roster.length, className: "px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white flex items-center gap-1", children: [_jsx(Download, { className: "w-3.5 h-3.5" }), "CSV"] }), _jsx("button", { onClick: onClose, className: "rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-slate-400", "aria-label": "Close", children: _jsx(X, { className: "w-5 h-5" }) })] })] }), _jsxs("div", { className: "px-6 pt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-[11px]", children: [_jsxs("div", { className: "flex flex-col bg-gray-50 dark:bg-slate-800/60 rounded-lg p-3 border border-gray-200 dark:border-slate-700", children: [_jsx("span", { className: "text-gray-500 dark:text-slate-400 uppercase tracking-wide", children: "Status" }), _jsx("span", { className: "font-medium text-gray-900 dark:text-white", children: meta?.class_status })] }), _jsxs("div", { className: "flex flex-col bg-gray-50 dark:bg-slate-800/60 rounded-lg p-3 border border-gray-200 dark:border-slate-700", children: [_jsx("span", { className: "text-gray-500 dark:text-slate-400 uppercase tracking-wide", children: "Payment" }), _jsxs("span", { className: "font-medium text-gray-900 dark:text-white", children: [meta?.payment_status || '—', " \u2022 \u20B9", (meta?.final_payment_amount ?? 0).toFixed(2)] })] }), _jsxs("div", { className: "flex flex-col bg-gray-50 dark:bg-slate-800/60 rounded-lg p-3 border border-gray-200 dark:border-slate-700", children: [_jsx("span", { className: "text-gray-500 dark:text-slate-400 uppercase tracking-wide", children: "Attendance" }), _jsxs("span", { className: "font-medium text-gray-900 dark:text-white", children: ["Present ", meta?.attended_count ?? 0, " \u2022 No Show ", meta?.no_show_count ?? 0, " \u2022 Absent ", meta?.absent_count ?? 0] })] }), _jsxs("div", { className: "flex flex-col bg-gray-50 dark:bg-slate-800/60 rounded-lg p-3 border border-gray-200 dark:border-slate-700", children: [_jsx("span", { className: "text-gray-500 dark:text-slate-400 uppercase tracking-wide", children: "Rating" }), _jsxs("span", { className: "font-medium text-gray-900 dark:text-white", children: [(meta?.avg_rating ?? 0).toFixed(2), " (", meta?.ratings_submitted ?? 0, ")"] })] })] }), _jsxs("div", { className: "flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-6", children: [error && (_jsx("div", { className: "text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 px-3 py-2 rounded-lg", children: error })), _jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 p-4", children: [_jsx("h3", { className: "text-sm font-semibold text-gray-800 dark:text-slate-200 mb-3", children: "Rating Distribution" }), ratingSummary.counts.every(c => c.count === 0) && (_jsx("p", { className: "text-xs text-gray-500 dark:text-slate-500", children: "No ratings yet." })), _jsx("div", { className: "flex flex-col gap-1", children: ratingDistBars }), ratingSummary.counts.some(c => c.count > 0) && (_jsxs("p", { className: "mt-2 text-[11px] text-gray-500 dark:text-slate-500", children: ["Average: ", ratingSummary.avg.toFixed(2)] }))] }), _jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700", children: [_jsxs("div", { className: "px-4 py-3 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between", children: [_jsxs("h3", { className: "text-sm font-semibold text-gray-800 dark:text-slate-200", children: ["Roster (", roster.length, ")"] }), loading && (_jsx("span", { className: "text-[11px] text-gray-500 dark:text-slate-400", children: "Loading\u2026" }))] }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200 dark:divide-slate-800 text-xs", children: [_jsx("thead", { className: "bg-gray-50 dark:bg-slate-800/70", children: _jsxs("tr", { children: [_jsx("th", { className: "px-3 py-2 text-left font-medium text-gray-600 dark:text-slate-300", children: "#" }), _jsx("th", { className: "px-3 py-2 text-left font-medium text-gray-600 dark:text-slate-300", children: "Member" }), _jsx("th", { className: "px-3 py-2 text-left font-medium text-gray-600 dark:text-slate-300", children: "Email" }), _jsx("th", { className: "px-3 py-2 text-left font-medium text-gray-600 dark:text-slate-300", children: "Status" }), _jsx("th", { className: "px-3 py-2 text-left font-medium text-gray-600 dark:text-slate-300", children: "Marked At" }), _jsx("th", { className: "px-3 py-2 text-left font-medium text-gray-600 dark:text-slate-300", children: "Marked By" })] }) }), _jsxs("tbody", { className: "bg-white dark:bg-slate-900 divide-y divide-gray-100 dark:divide-slate-800", children: [!loading && roster.length === 0 && (_jsx("tr", { children: _jsx("td", { colSpan: 6, className: "px-4 py-8 text-center text-gray-500 dark:text-slate-500", children: "No roster rows." }) })), roster.map((r, idx) => (_jsxs("tr", { className: "hover:bg-gray-50 dark:hover:bg-slate-800/60", children: [_jsx("td", { className: "px-3 py-2 text-gray-500 dark:text-slate-400 w-px", children: idx + 1 }), _jsx("td", { className: "px-3 py-2", children: _jsx("span", { className: "font-medium text-gray-800 dark:text-slate-100", children: r.full_name || r.member_id }) }), _jsx("td", { className: "px-3 py-2 text-gray-600 dark:text-slate-400", children: r.email || '—' }), _jsx("td", { className: "px-3 py-2", children: _jsx("span", { className: "px-2 py-1 rounded-full bg-gray-100 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-200", children: r.status || '—' }) }), _jsx("td", { className: "px-3 py-2 text-gray-600 dark:text-slate-400", children: r.marked_at ? new Date(r.marked_at).toLocaleString() : '—' }), _jsx("td", { className: "px-3 py-2 text-gray-600 dark:text-slate-400", children: r.marked_by || '—' })] }, r.booking_id)))] })] }) })] })] }), _jsxs("div", { className: "px-6 py-3 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between bg-gray-50 dark:bg-slate-800/40", children: [_jsx("span", { className: "text-[11px] text-gray-500 dark:text-slate-400", children: "Data reflects current snapshot (auto/manual refresh)." }), _jsx("button", { onClick: onClose, className: "px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white", children: "Close" })] })] }) }));
};
