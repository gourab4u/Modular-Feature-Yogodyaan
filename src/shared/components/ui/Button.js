import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function Button({ variant = 'primary', size = 'md', loading = false, children, className = '', disabled, ...props }) {
    const baseClasses = 'font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none';
    const variantClasses = {
        primary: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl focus:ring-emerald-500',
        secondary: 'bg-white hover:bg-gray-50 text-emerald-600 border-2 border-emerald-600 focus:ring-emerald-500',
        outline: 'bg-transparent hover:bg-emerald-50 text-emerald-600 border border-emerald-600 focus:ring-emerald-500'
    };
    const sizeClasses = {
        sm: 'px-4 py-2 text-sm',
        md: 'px-6 py-3 text-base',
        lg: 'px-8 py-4 text-lg'
    };
    return (_jsx("button", { className: `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`, disabled: disabled || loading, ...props, children: loading ? (_jsxs("div", { className: "flex items-center justify-center", children: [_jsx("div", { className: "animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" }), "Loading..."] })) : (children) }));
}
