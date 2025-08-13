import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Eye } from 'lucide-react';
export function ContentReview() {
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "flex justify-between items-center", children: _jsx("h2", { className: "text-2xl font-bold text-gray-900", children: "Content Review" }) }), _jsx("div", { className: "bg-white rounded-xl shadow-lg p-6", children: _jsxs("div", { className: "text-center py-12", children: [_jsx(Eye, { className: "w-12 h-12 text-gray-400 mx-auto mb-4" }), _jsx("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: "Content Review Dashboard" }), _jsx("p", { className: "text-gray-500", children: "Review and moderate user-generated content across the platform." })] }) })] }));
}
export default ContentReview;
