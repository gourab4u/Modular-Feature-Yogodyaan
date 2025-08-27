import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ShieldAlert, Users, X } from 'lucide-react';
import { useMemo } from 'react';
import { useAssignmentRoster } from '../hooks/useAssignmentRoster';
import { AttendanceTable } from './AttendanceTable';
/**
 * Lightweight modal (self-contained, no external Dialog dependency)
 */
export const AssignmentAttendanceModal = ({ open, onClose, assignment }) => {
    const assignmentId = assignment?.assignment_id;
    const { attendees, loading, error, refetch } = useAssignmentRoster(assignmentId, { enabled: open });
    // Determine edit lock (client-side helper; backend RLS still authoritative)
    const lockEditing = useMemo(() => {
        if (!assignment)
            return true;
        if (assignment.attendance_locked)
            return true;
        // If end time + 30m in past => lock (fallback if lock job lagging)
        if (assignment.date && assignment.end_time) {
            const end = new Date(`${assignment.date}T${assignment.end_time}`);
            if (!isNaN(end.getTime())) {
                if (Date.now() > end.getTime() + 30 * 60 * 1000) {
                    return true;
                }
            }
        }
        return false;
    }, [assignment]);
    if (!open)
        return null;
    return (_jsx("div", { className: "fixed inset-0 z-[200] flex items-start md:items-center justify-center p-4 bg-black/40 backdrop-blur-sm", role: "dialog", "aria-modal": "true", children: _jsxs("div", { className: "w-full max-w-3xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 flex flex-col max-h-[90vh]", children: [_jsxs("div", { className: "flex items-center justify-between gap-4 px-5 py-4 border-b border-gray-200 dark:border-slate-700", children: [_jsxs("div", { className: "flex flex-col", children: [_jsxs("h2", { className: "text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2", children: [_jsx(Users, { className: "w-5 h-5 text-blue-500" }), "Attendance"] }), assignment && (_jsxs("p", { className: "text-xs text-gray-500 dark:text-slate-400", children: [assignment.class_types?.name || 'Class', " \u2022 ", assignment.date, " \u2022 ", assignment.start_time, " - ", assignment.end_time] }))] }), _jsx("button", { onClick: onClose, className: "rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-slate-400", "aria-label": "Close", children: _jsx(X, { className: "w-5 h-5" }) })] }), _jsxs("div", { className: "p-5 overflow-y-auto flex flex-col gap-4", children: [error && (_jsx("div", { className: "text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 px-3 py-2 rounded-lg", children: error })), loading && !error && (_jsx("div", { className: "text-xs text-gray-500 dark:text-slate-500 px-1", children: "Loading roster\u2026" })), lockEditing && (_jsxs("div", { className: "flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 px-3 py-2 rounded-lg", children: [_jsx(ShieldAlert, { className: "w-4 h-4 mt-0.5" }), _jsx("span", { children: "Attendance editing locked (either manually locked or past 30 min window). You can still view statuses." })] })), _jsx(AttendanceTable, { assignmentId: assignmentId, attendees: attendees, lockEditing: lockEditing, autoReloadIntervalMs: 15000 })] }), _jsxs("div", { className: "flex items-center justify-between px-5 py-3 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/40", children: [_jsx("span", { className: "text-[11px] text-gray-500 dark:text-slate-400", children: "Changes are auto-saved. Backend RLS enforces final rules." }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => refetch(), className: "px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-600", children: "Refresh" }), _jsx("button", { onClick: onClose, className: "px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white", children: "Close" })] })] })] }) }));
};
