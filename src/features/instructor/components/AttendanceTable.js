import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { LoadingSpinner } from '../../../shared/components/ui/LoadingSpinner';
import { STATUS_METADATA } from '../../../shared/constants/attendanceStatus';
import { useAttendance } from '../hooks/useAttendance';
import { AttendanceStatusSelector } from './AttendanceStatusSelector';
/**
 * AttendanceTable
 * - Merges provided attendees with attendance records
 * - Allows updating status via useAttendance() hook (optimistic)
 * - Displays counts summary
 *
 * NOTE: For notes editing you can extend later with an inline textarea / dialog.
 */
export const AttendanceTable = ({ assignmentId, attendees, lockEditing = false, className = '', onStatusChange, compact = false, showNotes = false, hideHeader = false, autoReloadIntervalMs }) => {
    const { records, loading, error, upsert, optimisticUpdating, lastUpdatedAt } = useAttendance(assignmentId, { autoReloadIntervalMs });
    // Map attendance records by member_id for quick lookup
    const recordMap = useMemo(() => {
        const m = new Map();
        records.forEach(r => m.set(r.member_id, r));
        return m;
    }, [records]);
    // Derived merged rows
    const rows = useMemo(() => {
        return attendees.map(att => {
            const record = recordMap.get(att.member_id);
            return {
                ...att,
                record,
                status: record?.status
            };
        });
    }, [attendees, recordMap]);
    const counts = useMemo(() => {
        const c = Object.keys(STATUS_METADATA).reduce((acc, k) => {
            acc[k] = 0;
            return acc;
        }, {});
        records.forEach(r => {
            if (c[r.status] !== undefined)
                c[r.status] += 1;
        });
        return c;
    }, [records]);
    const totalMarked = records.length;
    const totalAttendees = attendees.length;
    const handleChange = async (memberId, status) => {
        if (lockEditing)
            return;
        try {
            await upsert({ member_id: memberId, status });
            const rec = recordMap.get(memberId);
            if (rec && onStatusChange) {
                onStatusChange(memberId, status, rec);
            }
        }
        catch {
            // error surfaced in hook
        }
    };
    return (_jsxs("div", { className: `flex flex-col gap-4 ${className}`, "data-assignment-id": assignmentId, children: [!hideHeader && (_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: "Attendance" }), _jsxs("div", { className: "flex flex-wrap gap-3 items-center text-xs text-gray-600 dark:text-slate-400", children: [_jsxs("span", { className: "font-medium", children: ["Marked: ", totalMarked, "/", totalAttendees] }), _jsxs("span", { children: ["Last Updated: ", lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleTimeString() : '—'] }), optimisticUpdating && (_jsxs("span", { className: "flex items-center gap-1 text-blue-600 dark:text-blue-400", children: [_jsx(LoadingSpinner, { size: "sm" }), " Saving..."] }))] })] })), error && (_jsxs("div", { className: "text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 px-3 py-2 rounded-lg", children: ["Error: ", error] })), _jsx("div", { className: "overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-700", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200 dark:divide-slate-700 text-sm", children: [_jsx("thead", { className: "bg-gray-50 dark:bg-slate-800", children: _jsxs("tr", { children: [_jsx("th", { className: "px-3 py-2 text-left font-medium text-gray-600 dark:text-slate-300", children: "#" }), _jsx("th", { className: "px-3 py-2 text-left font-medium text-gray-600 dark:text-slate-300", children: "Student" }), _jsx("th", { className: "px-3 py-2 text-left font-medium text-gray-600 dark:text-slate-300", children: "Status" }), showNotes && (_jsx("th", { className: "px-3 py-2 text-left font-medium text-gray-600 dark:text-slate-300", children: "Notes" }))] }) }), _jsxs("tbody", { className: "bg-white dark:bg-slate-900/50 divide-y divide-gray-100 dark:divide-slate-800", children: [loading && rows.length === 0 && (_jsx("tr", { children: _jsx("td", { colSpan: showNotes ? 4 : 3, className: "px-4 py-8 text-center", children: _jsx(LoadingSpinner, {}) }) })), rows.map((r, idx) => {
                                    const status = r.status || 'present'; // default suggestion
                                    return (_jsxs("tr", { className: "hover:bg-gray-50 dark:hover:bg-slate-800/60", children: [_jsx("td", { className: "px-3 py-2 text-gray-500 dark:text-slate-400 w-px", children: idx + 1 }), _jsx("td", { className: "px-3 py-2", children: _jsxs("div", { className: "flex flex-col", children: [_jsx("span", { className: "font-medium text-gray-900 dark:text-white", children: r.name || r.member_id }), r.email && (_jsx("span", { className: "text-xs text-gray-500 dark:text-slate-400", children: r.email }))] }) }), _jsx("td", { className: "px-3 py-2", children: _jsx(AttendanceStatusSelector, { value: status, disabled: lockEditing || optimisticUpdating, onChange: next => handleChange(r.member_id, next), size: compact ? 'sm' : 'md' }) }), showNotes && (_jsx("td", { className: "px-3 py-2 text-xs text-gray-600 dark:text-slate-400", children: r.record?.notes || '—' }))] }, r.member_id));
                                }), rows.length === 0 && !loading && (_jsx("tr", { children: _jsx("td", { colSpan: showNotes ? 4 : 3, className: "px-4 py-8 text-center text-gray-500 dark:text-slate-400", children: "No attendees provided." }) }))] })] }) }), _jsxs("div", { className: "flex flex-wrap gap-3 text-[11px] text-gray-600 dark:text-slate-400", children: [Object.entries(counts).map(([k, v]) => {
                        if (v === 0)
                            return null;
                        return (_jsxs("span", { className: "px-2 py-1 rounded-full bg-gray-100 dark:bg-slate-700/40 border border-gray-200 dark:border-slate-600", title: STATUS_METADATA[k].description, children: [STATUS_METADATA[k].label, ": ", v] }, k));
                    }), (totalMarked < totalAttendees) && (_jsxs("span", { className: "px-2 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-300", children: ["Unmarked: ", totalAttendees - totalMarked] }))] })] }));
};
