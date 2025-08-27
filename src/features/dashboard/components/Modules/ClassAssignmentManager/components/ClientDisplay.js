import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ChevronDown, ChevronRight, Users, Mail, Hash } from 'lucide-react';
import { useState } from 'react';
import { getPrimaryClientDisplay, getBookingDetails } from '../types';
export function ClientDisplay({ assignment, compact = false, className = '' }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const primaryDisplay = getPrimaryClientDisplay(assignment);
    const bookingDetails = getBookingDetails(assignment);
    if (!primaryDisplay) {
        return null;
    }
    // If only one booking or in compact mode, show simple display
    if (bookingDetails.length <= 1 || compact) {
        return (_jsxs("div", { className: `flex items-center text-sm text-gray-600 ${className}`, children: [_jsx(Users, { className: "w-4 h-4 mr-1 flex-shrink-0" }), _jsx("span", { className: "truncate", children: primaryDisplay })] }));
    }
    // Multiple bookings - show expandable display
    return (_jsxs("div", { className: className, children: [_jsxs("button", { onClick: () => setIsExpanded(!isExpanded), className: "flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors w-full text-left group", children: [_jsx(Users, { className: "w-4 h-4 mr-1 flex-shrink-0" }), _jsx("span", { className: "truncate mr-2", children: primaryDisplay }), isExpanded ? (_jsx(ChevronDown, { className: "w-3 h-3 flex-shrink-0 group-hover:text-blue-600" })) : (_jsx(ChevronRight, { className: "w-3 h-3 flex-shrink-0 group-hover:text-blue-600" }))] }), isExpanded && (_jsxs("div", { className: "mt-2 ml-5 space-y-2 bg-gray-50 rounded-md p-3 border border-gray-200", children: [_jsxs("div", { className: "text-xs font-medium text-gray-500 uppercase tracking-wide", children: ["Booking Details (", bookingDetails.length, " clients)"] }), bookingDetails.map((detail, index) => (_jsx("div", { className: "bg-white rounded border border-gray-200 p-2", children: _jsx("div", { className: "flex items-start justify-between", children: _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(Users, { className: "w-3 h-3 mr-1 text-blue-600 flex-shrink-0" }), _jsx("span", { className: "font-medium text-gray-900 text-sm truncate", children: detail.name }), index === 0 && (_jsx("span", { className: "ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full", children: "Primary" }))] }), detail.email && (_jsxs("div", { className: "flex items-center mt-1", children: [_jsx(Mail, { className: "w-3 h-3 mr-1 text-gray-400 flex-shrink-0" }), _jsx("span", { className: "text-xs text-gray-600 truncate", children: detail.email })] })), _jsxs("div", { className: "flex items-center mt-1", children: [_jsx(Hash, { className: "w-3 h-3 mr-1 text-gray-400 flex-shrink-0" }), _jsx("span", { className: "text-xs font-mono text-gray-500 truncate", children: detail.bookingId })] })] }) }) }, detail.bookingId)))] }))] }));
}
