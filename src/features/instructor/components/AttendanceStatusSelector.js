import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { ATTENDANCE_OPTIONS, STATUS_METADATA, getAttendanceBadgeClasses } from '../../../shared/constants/attendanceStatus';
/**
 * Selector for attendance status.
 * Renders either a compact dropdown (default) or an inline segmented control if inline=true.
 */
export const AttendanceStatusSelector = ({ value, disabled = false, onChange, size = 'md', inline = false, showDescriptions = false, label }) => {
    const [open, setOpen] = useState(false);
    if (inline) {
        return (_jsxs("div", { className: "space-y-1", children: [label && (_jsx("p", { className: "text-xs font-medium text-gray-600 dark:text-slate-400", children: label })), _jsx("div", { className: "flex flex-wrap gap-2", children: ATTENDANCE_OPTIONS.map(opt => {
                        const active = opt.value === value;
                        return (_jsx("button", { type: "button", disabled: disabled, onClick: () => onChange(opt.value), title: opt.description, className: `transition-all border rounded-full px-3 py-1 text-xs font-medium focus:outline-none
                                    ${active
                                ? getAttendanceBadgeClasses(opt.value)
                                : 'border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-600'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`, children: STATUS_METADATA[opt.value].label }, opt.value));
                    }) }), showDescriptions && (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-2 mt-3 max-h-48 overflow-auto pr-1", children: ATTENDANCE_OPTIONS.map(opt => (_jsxs("div", { className: "text-xs p-2 rounded border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("span", { className: `inline-block w-2 h-2 rounded-full bg-${STATUS_METADATA[opt.value].color}-500` }), _jsx("span", { className: "font-semibold", children: STATUS_METADATA[opt.value].label })] }), _jsx("p", { className: "text-gray-600 dark:text-slate-400 leading-snug", children: STATUS_METADATA[opt.value].description })] }, opt.value))) }))] }));
    }
    // Dropdown version
    return (_jsxs("div", { className: "relative inline-block text-left", children: [label && (_jsx("p", { className: "text-xs font-medium text-gray-600 dark:text-slate-400 mb-1", children: label })), _jsxs("button", { type: "button", disabled: disabled, onClick: () => setOpen(o => !o), className: `w-full min-w-[160px] justify-between inline-flex items-center gap-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 px-3 ${size === 'sm' ? 'py-1 text-xs' : 'py-2 text-sm'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-slate-600'}`, children: [_jsx("span", { className: `flex-1 text-left truncate ${getAttendanceBadgeClasses(value)} border-0 px-0 py-0 bg-transparent`, children: STATUS_METADATA[value].label }), _jsx("svg", { className: "w-4 h-4 text-gray-500 dark:text-slate-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M19 9l-7 7-7-7" }) })] }), open && !disabled && (_jsx("div", { className: "absolute z-30 mt-1 w-72 max-h-80 overflow-auto origin-top-left bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-lg p-2", children: ATTENDANCE_OPTIONS.map(opt => {
                    const active = opt.value === value;
                    return (_jsxs("button", { type: "button", onClick: () => {
                            onChange(opt.value);
                            setOpen(false);
                        }, className: `w-full text-left p-2 rounded-md flex flex-col gap-1 transition ${active
                            ? 'bg-blue-50 dark:bg-blue-900/30 ring-1 ring-blue-300 dark:ring-blue-600'
                            : 'hover:bg-gray-100 dark:hover:bg-slate-700'}`, children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: `${getAttendanceBadgeClasses(opt.value)} border px-2 py-0.5`, children: STATUS_METADATA[opt.value].label }), active && (_jsx("svg", { className: "w-4 h-4 text-blue-500 dark:text-blue-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M5 13l4 4L19 7" }) }))] }), _jsx("p", { className: "text-[11px] leading-snug text-gray-600 dark:text-slate-400", children: STATUS_METADATA[opt.value].description })] }, opt.value));
                }) })), open && (_jsx("div", { className: "fixed inset-0 z-20", onClick: () => setOpen(false), "aria-hidden": "true" }))] }));
};
