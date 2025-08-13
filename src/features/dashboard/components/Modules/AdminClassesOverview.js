import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BarChart2, Calendar, Download, Filter, RefreshCw, Search, Users } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useAdminClassOverview } from '../../hooks/useAdminClassOverview';
import { useInstructors } from '../../hooks/useInstructors'; // JS hook is fine for TS usage
import { AdminClassDrilldownModal } from './AdminClassDrilldownModal';
/**
 * Admin / Super Admin Classes Overview Module
 * Features:
 * - Filters: date range, instructor, class_status, payment_status, search
 * - Aggregates cards (attendance, rating)
 * - Rating distribution (global for filtered set)
 * - Table of classes (paginated client-side)
 * - CSV export (overview data)
 * - Drill-down modal (roster + rating distribution per class)
 */
const statusOptions = ['all', 'scheduled', 'completed', 'canceled', 'not_conducted', 'rescheduled'];
const paymentStatusOptions = ['all', 'pending', 'paid', 'approved', 'withheld', 'reversed'];
const PAGE_SIZE = 25;
export const AdminClassesOverview = () => {
    // Filters state
    const [filters, setFilters] = useState({
        from: null,
        to: null,
        instructor_id: 'all',
        class_status: 'all',
        payment_status: 'all',
        search: ''
    });
    // Local UI
    const [page, setPage] = useState(1);
    const [showRatingDist, setShowRatingDist] = useState(true);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    // Data
    const { rows, loading, error, aggregates, ratingDistribution, refetch } = useAdminClassOverview(filters, { autoReloadMs: 60000 });
    const { instructors } = useInstructors();
    const instructorMap = useMemo(() => {
        const m = new Map();
        instructors.forEach((i) => m.set(i.id, i));
        return m;
    }, [instructors]);
    // Derived paging
    const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    const pagedRows = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return rows.slice(start, start + PAGE_SIZE);
    }, [page, rows]);
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPage(1);
    };
    const exportOverviewCsv = useCallback(() => {
        if (!rows.length)
            return;
        const headers = [
            'assignment_id',
            'instructor_id',
            'date',
            'start_time',
            'end_time',
            'class_status',
            'payment_status',
            'final_payment_amount',
            'attended_count',
            'absent_count',
            'no_show_count',
            'avg_rating',
            'ratings_submitted'
        ];
        const lines = [headers.join(',')];
        rows.forEach(r => {
            const row = [
                r.assignment_id,
                r.instructor_id,
                r.date,
                r.start_time,
                r.end_time,
                r.class_status,
                r.payment_status || '',
                (r.final_payment_amount ?? '').toString(),
                (r.attended_count ?? 0).toString(),
                (r.absent_count ?? 0).toString(),
                (r.no_show_count ?? 0).toString(),
                (r.avg_rating ?? 0).toFixed(2),
                r.ratings_submitted.toString()
            ];
            lines.push(row.map(v => typeof v === 'string' && v.includes(',') ? JSON.stringify(v) : v).join(','));
        });
        const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'admin_classes_overview.csv';
        a.click();
        URL.revokeObjectURL(url);
    }, [rows]);
    const ratingDistBars = useMemo(() => {
        const total = ratingDistribution.reduce((acc, r) => acc + r.count, 0);
        if (total === 0) {
            return _jsx("p", { className: "text-xs text-gray-500 dark:text-slate-500", children: "No ratings in dataset." });
        }
        return ratingDistribution.map(rd => {
            const pct = total === 0 ? 0 : (rd.count / total) * 100;
            return (_jsxs("div", { className: "flex items-center gap-2 text-xs", children: [_jsxs("span", { className: "w-5 font-medium", children: [rd.rating, "\u2605"] }), _jsx("div", { className: "flex-1 h-2 rounded bg-gray-200 dark:bg-slate-700 overflow-hidden", children: _jsx("div", { className: "h-full bg-indigo-500 dark:bg-indigo-400", style: { width: `${pct}%` } }) }), _jsx("span", { className: "w-8 text-right", children: rd.count })] }, rd.rating));
        });
    }, [ratingDistribution]);
    return (_jsxs("div", { className: "min-h-screen bg-gray-50 dark:bg-slate-900", children: [_jsx("div", { className: "border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900", children: _jsxs("div", { className: "mx-auto max-w-7xl px-4 py-6 flex flex-col gap-4", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-4", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(BarChart2, { className: "w-8 h-8 text-blue-600 dark:text-blue-400" }), _jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Classes Overview" }), _jsx("p", { className: "text-xs text-gray-600 dark:text-slate-400", children: "Administrative visibility: attendance, payments, ratings." })] })] }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsxs("button", { onClick: () => refetch(), className: "inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-600", children: [_jsx(RefreshCw, { className: "w-4 h-4" }), "Refresh"] }), _jsxs("button", { onClick: exportOverviewCsv, disabled: !rows.length, className: "inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white", children: [_jsx(Download, { className: "w-4 h-4" }), "Export CSV"] }), _jsxs("button", { onClick: () => setShowRatingDist(v => !v), className: "inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white", children: ["Ratings ", showRatingDist ? '−' : '+'] })] })] }), _jsxs("div", { className: "grid gap-4 md:grid-cols-5", children: [_jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4 flex flex-col gap-1", children: [_jsx("span", { className: "text-xs text-gray-500 dark:text-slate-400", children: "Total Classes" }), _jsx("span", { className: "text-xl font-semibold text-gray-900 dark:text-white", children: aggregates.total_classes })] }), _jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4 flex flex-col gap-1", children: [_jsx("span", { className: "text-xs text-gray-500 dark:text-slate-400", children: "Attended" }), _jsx("span", { className: "text-xl font-semibold text-emerald-600 dark:text-emerald-400", children: aggregates.attended_total })] }), _jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4 flex flex-col gap-1", children: [_jsx("span", { className: "text-xs text-gray-500 dark:text-slate-400", children: "No Show" }), _jsx("span", { className: "text-xl font-semibold text-amber-600 dark:text-amber-400", children: aggregates.no_show_total })] }), _jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4 flex flex-col gap-1", children: [_jsx("span", { className: "text-xs text-gray-500 dark:text-slate-400", children: "Absent" }), _jsx("span", { className: "text-xl font-semibold text-red-600 dark:text-red-400", children: aggregates.absent_total })] }), _jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4 flex flex-col gap-1", children: [_jsx("span", { className: "text-xs text-gray-500 dark:text-slate-400", children: "Avg Rating" }), _jsx("span", { className: "text-xl font-semibold text-indigo-600 dark:text-indigo-400", children: aggregates.avg_rating_overall.toFixed(2) })] })] })] }) }), _jsxs("div", { className: "mx-auto max-w-7xl px-4 py-6 flex flex-col gap-8", children: [_jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5", children: [_jsxs("div", { className: "flex items-center gap-2 mb-4", children: [_jsx(Filter, { className: "w-4 h-4 text-gray-500 dark:text-slate-400" }), _jsx("h2", { className: "text-sm font-semibold text-gray-900 dark:text-white", children: "Filters" })] }), _jsxs("div", { className: "grid gap-4 md:grid-cols-3 lg:grid-cols-6", children: [_jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "text-xs font-medium text-gray-600 dark:text-slate-400", children: "From" }), _jsx("input", { type: "date", value: filters.from ? filters.from.toISOString().split('T')[0] : '', onChange: e => handleFilterChange('from', e.target.value ? new Date(e.target.value) : null), className: "px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-gray-900 dark:text-white" })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "text-xs font-medium text-gray-600 dark:text-slate-400", children: "To" }), _jsx("input", { type: "date", value: filters.to ? filters.to.toISOString().split('T')[0] : '', onChange: e => handleFilterChange('to', e.target.value ? new Date(e.target.value) : null), className: "px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-gray-900 dark:text-white" })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsxs("label", { className: "text-xs font-medium text-gray-600 dark:text-slate-400 flex items-center gap-1", children: [_jsx(Users, { className: "w-3 h-3" }), " Instructor"] }), _jsxs("select", { value: filters.instructor_id, onChange: e => handleFilterChange('instructor_id', e.target.value), className: "px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-gray-900 dark:text-white", children: [_jsx("option", { value: "all", children: "All" }), instructors.map((inst) => (_jsxs("option", { value: inst.id, children: [inst.name, " (", inst.email, ")"] }, inst.id)))] })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "text-xs font-medium text-gray-600 dark:text-slate-400", children: "Class Status" }), _jsx("select", { value: filters.class_status, onChange: e => handleFilterChange('class_status', e.target.value), className: "px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-gray-900 dark:text-white", children: statusOptions.map(s => _jsx("option", { value: s, children: s }, s)) })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "text-xs font-medium text-gray-600 dark:text-slate-400", children: "Payment Status" }), _jsx("select", { value: filters.payment_status, onChange: e => handleFilterChange('payment_status', e.target.value), className: "px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-gray-900 dark:text-white", children: paymentStatusOptions.map(s => _jsx("option", { value: s, children: s }, s)) })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsxs("label", { className: "text-xs font-medium text-gray-600 dark:text-slate-400 flex items-center gap-1", children: [_jsx(Search, { className: "w-3 h-3" }), " Search"] }), _jsx("input", { type: "text", value: filters.search, onChange: e => handleFilterChange('search', e.target.value), placeholder: "ID or status...", className: "px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-gray-900 dark:text-white" })] })] })] }), showRatingDist && (_jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5 flex flex-col gap-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("h2", { className: "text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2", children: [_jsx(BarChart2, { className: "w-4 h-4 text-indigo-500" }), "Rating Distribution (Filtered Set)"] }), _jsxs("span", { className: "text-[11px] text-gray-500 dark:text-slate-400", children: ["Weighted Avg: ", aggregates.avg_rating_overall.toFixed(2)] })] }), _jsx("div", { className: "flex flex-col gap-1", children: ratingDistBars })] })), _jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700", children: [_jsxs("div", { className: "px-5 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between", children: [_jsxs("h2", { className: "text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2", children: [_jsx(Calendar, { className: "w-4 h-4 text-blue-500" }), "Classes (", rows.length, ")"] }), loading && _jsx("span", { className: "text-[11px] text-gray-500 dark:text-slate-400", children: "Loading\u2026" }), error && (_jsx("span", { className: "text-[11px] text-red-600 dark:text-red-400", children: error }))] }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200 dark:divide-slate-700 text-sm", children: [_jsx("thead", { className: "bg-gray-50 dark:bg-slate-800/60", children: _jsxs("tr", { children: [_jsx("th", { className: "px-3 py-2 text-left font-medium text-gray-600 dark:text-slate-300", children: "Class" }), _jsx("th", { className: "px-3 py-2 text-left font-medium text-gray-600 dark:text-slate-300", children: "When" }), _jsx("th", { className: "px-3 py-2 text-left font-medium text-gray-600 dark:text-slate-300", children: "Assignment" }), _jsx("th", { className: "px-3 py-2 text-left font-medium text-gray-600 dark:text-slate-300", children: "Instructor" }), _jsx("th", { className: "px-3 py-2 text-left font-medium text-gray-600 dark:text-slate-300", children: "Status" }), _jsx("th", { className: "px-3 py-2 text-left font-medium text-gray-600 dark:text-slate-300", children: "Payment" }), _jsx("th", { className: "px-3 py-2 text-center font-medium text-gray-600 dark:text-slate-300", children: "Attendance" }), _jsx("th", { className: "px-3 py-2 text-center font-medium text-gray-600 dark:text-slate-300", children: "Rating" }), _jsx("th", { className: "px-3 py-2 text-right font-medium text-gray-600 dark:text-slate-300", children: "Actions" })] }) }), _jsxs("tbody", { className: "bg-white dark:bg-slate-900 divide-y divide-gray-100 dark:divide-slate-800", children: [pagedRows.map(r => {
                                                    const attendanceStr = `P:${r.attended_count ?? 0} N:${r.no_show_count ?? 0} A:${r.absent_count ?? 0}`;
                                                    return (_jsxs("tr", { className: "hover:bg-gray-50 dark:hover:bg-slate-800/60", children: [_jsx("td", { className: "px-3 py-2 text-gray-900 dark:text-white", children: _jsxs("div", { className: "flex flex-col", children: [_jsx("span", { className: "font-semibold", children: r.class_type_name || '—' }), r.class_type_difficulty && (_jsx("span", { className: "text-xs text-gray-500 dark:text-slate-400", children: r.class_type_difficulty })), r.class_type_duration && (_jsxs("span", { className: "text-xs text-gray-500 dark:text-slate-400", children: [r.class_type_duration, " min"] }))] }) }), _jsx("td", { className: "px-3 py-2 text-gray-700 dark:text-slate-300", children: _jsxs("span", { children: [r.date, " \u2022 ", r.start_time, "-", r.end_time, r.timezone && (_jsx("span", { className: "text-xs text-gray-500 dark:text-slate-400 ml-1", children: r.timezone }))] }) }), _jsx("td", { className: "px-3 py-2 text-blue-600 dark:text-blue-400 text-xs", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("code", { title: r.assignment_id, children: [r.assignment_id.slice(0, 8), "\u2026"] }), _jsx("button", { type: "button", onClick: () => navigator.clipboard.writeText(r.assignment_id), className: "text-[10px] px-1 py-0.5 rounded bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-600 dark:text-slate-300", title: "Copy full ID", children: "Copy" })] }) }), _jsx("td", { className: "px-3 py-2 text-gray-700 dark:text-slate-300", children: _jsxs("div", { className: "flex flex-col", children: [_jsx("span", { className: "font-medium", children: instructorMap.get(r.instructor_id)?.name || r.instructor_id.slice(0, 8) + '…' }), instructorMap.get(r.instructor_id)?.email && (_jsx("span", { className: "text-[11px] text-gray-500 dark:text-slate-400", children: instructorMap.get(r.instructor_id).email }))] }) }), _jsx("td", { className: "px-3 py-2", children: _jsx("span", { className: "px-2 py-1 rounded-full bg-gray-100 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-200 text-xs", children: r.class_status }) }), _jsxs("td", { className: "px-3 py-2 text-xs text-gray-700 dark:text-slate-300", children: [r.payment_status || '—', " \u2022 \u20B9", (r.final_payment_amount ?? 0).toFixed(2)] }), _jsx("td", { className: "px-3 py-2 text-center text-xs text-gray-700 dark:text-slate-300", children: attendanceStr }), _jsxs("td", { className: "px-3 py-2 text-center text-xs text-gray-700 dark:text-slate-300", children: [(r.avg_rating ?? 0).toFixed(2), " (", r.ratings_submitted, ")"] }), _jsx("td", { className: "px-3 py-2 text-right", children: _jsx("button", { onClick: () => setSelectedAssignment({ id: r.assignment_id, meta: r }), className: "text-xs px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium", children: "View" }) })] }, r.assignment_id));
                                                }), (!loading && pagedRows.length === 0) && (_jsx("tr", { children: _jsx("td", { colSpan: 9, className: "px-4 py-10 text-center text-sm text-gray-500 dark:text-slate-500", children: "No classes for current filter set." }) }))] })] }) }), rows.length > PAGE_SIZE && (_jsxs("div", { className: "flex items-center justify-between p-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/40 text-xs", children: [_jsxs("span", { className: "text-gray-500 dark:text-slate-400", children: ["Page ", page, " of ", totalPages, " \u2022 ", rows.length, " rows"] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => setPage(p => Math.max(1, p - 1)), disabled: page === 1, className: "px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 disabled:opacity-40 text-gray-700 dark:text-slate-200", children: "Prev" }), _jsx("button", { onClick: () => setPage(p => Math.min(totalPages, p + 1)), disabled: page === totalPages, className: "px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 disabled:opacity-40 text-gray-700 dark:text-slate-200", children: "Next" })] })] }))] })] }), _jsx(AdminClassDrilldownModal, { open: !!selectedAssignment, onClose: () => setSelectedAssignment(null), assignmentId: selectedAssignment?.id || null, meta: selectedAssignment?.meta })] }));
};
export default AdminClassesOverview;
