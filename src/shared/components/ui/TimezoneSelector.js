import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Globe, Clock } from 'lucide-react';
import { COMMON_TIMEZONES, getTimezoneDisplayName } from '../../utils/timezoneUtils';
export function TimezoneSelector({ value, onChange, disabled = false, showCurrentTime = true }) {
    const currentTime = showCurrentTime ? getCurrentTimeInTimezone(value) : null;
    const popularTimezones = COMMON_TIMEZONES.filter(tz => tz.popular);
    const otherTimezones = COMMON_TIMEZONES.filter(tz => !tz.popular);
    function getCurrentTimeInTimezone(timezone) {
        try {
            return new Intl.DateTimeFormat('en-US', {
                timeZone: timezone,
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }).format(new Date());
        }
        catch {
            return 'Invalid timezone';
        }
    }
    return (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Globe, { className: "w-4 h-4 text-gray-500" }), _jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Timezone" }), currentTime && (_jsxs("div", { className: "flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400", children: [_jsx(Clock, { className: "w-3 h-3" }), _jsx("span", { children: currentTime })] }))] }), _jsxs("select", { value: value, onChange: (e) => onChange(e.target.value), disabled: disabled, className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed", children: [_jsx("optgroup", { label: "Popular Timezones", children: popularTimezones.map(tz => (_jsxs("option", { value: tz.value, children: [tz.label, " (", tz.offset, ")"] }, tz.value))) }), _jsx("optgroup", { label: "Other Timezones", children: otherTimezones.map(tz => (_jsxs("option", { value: tz.value, children: [tz.label, " (", tz.offset, ")"] }, tz.value))) })] }), _jsxs("div", { className: "text-xs text-gray-500 dark:text-gray-400", children: ["Selected: ", getTimezoneDisplayName(value), showCurrentTime && currentTime && ` • Current time: ${currentTime}`] })] }));
}
