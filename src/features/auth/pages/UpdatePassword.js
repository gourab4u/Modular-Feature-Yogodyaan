import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Button } from '../../../shared/components/ui/Button';
import { supabase } from '../../../shared/lib/supabase';
export function UpdatePassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (!session || error) {
                setError('Auth session missing! Please try resetting your password again.');
            }
        };
        checkSession();
    }, []);
    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            setLoading(false);
            return;
        }
        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) {
                throw error;
            }
            setMessage('Password updated successfully! Redirecting to login page...');
            setTimeout(() => {
                window.location.href = '/login';
            }, 3000);
        }
        catch (err) {
            setError(err.message || 'An error occurred. Please try again.');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "max-w-md w-full space-y-8", children: [_jsxs("div", { className: "text-center", children: [_jsx("h2", { className: "text-3xl font-bold text-gray-900 dark:text-white", children: "Update Your Password" }), _jsx("p", { className: "mt-2 text-gray-600 dark:text-gray-300", children: "Enter your new password below." })] }), _jsxs("form", { onSubmit: handleUpdatePassword, className: "space-y-6", children: [message && (_jsx("div", { className: "bg-green-50 border border-green-200 rounded-lg p-3", children: _jsx("p", { className: "text-green-600 text-sm", children: message }) })), error && (_jsx("div", { className: "bg-red-50 border border-red-200 rounded-lg p-3", children: _jsx("p", { className: "text-red-600 text-sm", children: error }) })), _jsxs("div", { children: [_jsx("label", { htmlFor: "password", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "New Password" }), _jsx("input", { type: "password", id: "password", name: "password", value: password, onChange: (e) => setPassword(e.target.value), className: "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100", placeholder: "Enter your new password", required: true })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "confirmPassword", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Confirm New Password" }), _jsx("input", { type: "password", id: "confirmPassword", name: "confirmPassword", value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value), className: "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100", placeholder: "Confirm your new password", required: true })] }), !message && (_jsx(Button, { type: "submit", loading: loading, className: "w-full", children: loading ? 'Updating...' : 'Update Password' }))] })] }) }));
}
