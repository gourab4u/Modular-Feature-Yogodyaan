import { jsx as _jsx } from "react/jsx-runtime";
export function LoadingSpinner({ size = 'md', color = 'text-emerald-600' }) {
    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-8 w-8',
        lg: 'h-12 w-12'
    };
    return (_jsx("div", { className: "flex justify-center items-center", children: _jsx("div", { className: `animate-spin rounded-full border-b-2 border-current ${sizeClasses[size]} ${color}` }) }));
}
