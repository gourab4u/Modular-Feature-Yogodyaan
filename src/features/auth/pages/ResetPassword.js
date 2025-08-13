import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Button } from '../../../shared/components/ui/Button';
import { supabase } from '../../../shared/lib/supabase';
export function ResetPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/update-password`,
            });
            if (error) {
                throw error;
            }
            setMessage('Password reset email sent! Please check your inbox.');
        }
        catch (err) {
            setError(err.message || 'An error occurred. Please try again.');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "max-w-md w-full space-y-8", children: [_jsxs("div", { className: "text-center", children: [_jsx("h2", { className: "text-3xl font-bold text-gray-900 dark:text-white", children: "Reset Your Password" }), _jsx("p", { className: "mt-2 text-gray-600 dark:text-gray-300", children: "Enter your email address to receive a password reset link." })] }), _jsxs("form", { onSubmit: handleResetPassword, className: "space-y-6", children: [message && (_jsx("div", { className: "bg-green-50 border border-green-200 rounded-lg p-3", children: _jsx("p", { className: "text-green-600 text-sm", children: message }) })), error && (_jsx("div", { className: "bg-red-50 border border-red-200 rounded-lg p-3", children: _jsx("p", { className: "text-red-600 text-sm", children: error }) })), _jsxs("div", { children: [_jsx("label", { htmlFor: "email", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Email Address" }), _jsx("input", { type: "email", id: "email", name: "email", value: email, onChange: (e) => setEmail(e.target.value), className: "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100", placeholder: "Enter your email", required: true })] }), _jsx(Button, { type: "submit", loading: loading, className: "w-full", children: loading ? 'Sending...' : 'Send Reset Link' })] })] }) }));
}
