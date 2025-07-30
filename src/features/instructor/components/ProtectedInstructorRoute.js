import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../auth/contexts/AuthContext';
import { LoadingSpinner } from '../../../shared/components/ui/LoadingSpinner';
export function ProtectedInstructorRoute({ children }) {
    const { user, userRoles, loading } = useAuth();
    if (loading) {
        return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center", children: _jsx(LoadingSpinner, { size: "lg" }) }));
    }
    if (!user) {
        return _jsx(Navigate, { to: "/login", state: { redirectTo: window.location.pathname }, replace: true });
    }
    // Check if user has instructor or yoga_acharya role
    const hasInstructorRole = userRoles.some(role => role.toLowerCase() === 'instructor' || role.toLowerCase() === 'yoga_acharya');
    if (!hasInstructorRole) {
        return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center", children: _jsxs("div", { className: "max-w-md w-full bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-8 text-center", children: [_jsx("div", { className: "w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx("svg", { className: "w-8 h-8 text-red-600 dark:text-red-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" }) }) }), _jsx("h2", { className: "text-2xl font-bold text-gray-900 dark:text-white mb-4", children: "Access Denied" }), _jsx("p", { className: "text-gray-600 dark:text-slate-300 mb-6", children: "You need to have instructor or yoga acharya privileges to access the Teaching Dashboard." }), _jsxs("div", { className: "flex gap-3 justify-center", children: [_jsx("button", { onClick: () => window.history.back(), className: "px-4 py-2 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white", children: "Go Back" }), _jsx("button", { onClick: () => window.location.href = '/dashboard', className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700", children: "Go to Dashboard" })] })] }) }));
    }
    return _jsx(_Fragment, { children: children });
}
