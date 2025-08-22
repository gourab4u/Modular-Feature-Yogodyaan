import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { CheckCircle, Mail } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../../shared/components/ui/Button';
import { supabase } from '../../../shared/lib/supabase';
export function NewsletterSignup({ className = '', showTitle = true }) {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [subscribed, setSubscribed] = useState(false);
    const [error, setError] = useState('');
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim()) {
            setError('Email is required');
            return;
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
            setError('Please enter a valid email address');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const emailTrim = email.trim();
            // Check existing subscriber
            const { data: existing, error: fetchError } = await supabase
                .from('newsletter_subscribers')
                .select('id, status')
                .eq('email', emailTrim)
                .limit(1)
                .maybeSingle();
            if (fetchError) {
                throw fetchError;
            }
            if (existing) {
                if (existing.status === 'active') {
                    setError('This email is already subscribed to our newsletter');
                    return;
                }
                // Reactivate previously unsubscribed user
                const { error: reactError } = await supabase
                    .from('newsletter_subscribers')
                    .update({
                    status: 'active',
                    name: name.trim() || null,
                    updated_at: new Date().toISOString()
                })
                    .eq('id', existing.id);
                if (reactError)
                    throw reactError;
                setSubscribed(true);
                setEmail('');
                setName('');
                return;
            }
            // Not existing: insert new subscriber
            const { error: submitError } = await supabase
                .from('newsletter_subscribers')
                .insert([{
                    email: emailTrim,
                    name: name.trim() || null,
                    status: 'active',
                    updated_at: new Date().toISOString()
                }]);
            if (submitError) {
                // Unique constraint or conflict -> treat as already subscribed
                if (submitError.code === '23505' || submitError?.status === 409) {
                    setError('This email is already subscribed to our newsletter');
                }
                else {
                    throw submitError;
                }
                return;
            }
            setSubscribed(true);
            setEmail('');
            setName('');
        }
        catch (error) {
            console.error('Newsletter signup error:', error);
            setError('Failed to subscribe. Please try again.');
        }
        finally {
            setLoading(false);
        }
    };
    if (subscribed) {
        return (_jsxs("div", { className: `bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center ${className}`, children: [_jsx(CheckCircle, { className: "w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-4" }), _jsx("h3", { className: "text-lg font-semibold text-green-900 dark:text-green-100 mb-2", children: "Successfully Subscribed!" }), _jsx("p", { className: "text-green-700 dark:text-green-200", children: "Thank you for subscribing to our newsletter. You'll receive updates about new classes, wellness tips, and special offers." }), _jsx("button", { onClick: () => setSubscribed(false), className: "mt-4 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium text-sm", children: "Subscribe another email" })] }));
    }
    return (_jsxs("div", { className: `bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-600 p-6 ${className}`, children: [showTitle && (_jsxs("div", { className: "text-center mb-6", children: [_jsx(Mail, { className: "w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" }), _jsx("h3", { className: "text-xl font-semibold text-gray-900 dark:text-white mb-2", children: "Stay Updated" }), _jsx("p", { className: "text-gray-600 dark:text-slate-300", children: "Get the latest yoga tips, class updates, and wellness insights delivered to your inbox." })] })), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [error && (_jsx("div", { className: "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3", children: _jsx("p", { className: "text-red-600 dark:text-red-400 text-sm", children: error }) })), _jsxs("div", { children: [_jsx("label", { htmlFor: "newsletter-name", className: "block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1", children: "Name (Optional)" }), _jsx("input", { type: "text", id: "newsletter-name", value: name, onChange: (e) => setName(e.target.value), className: "w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400", placeholder: "Your name" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "newsletter-email", className: "block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1", children: "Email Address *" }), _jsx("input", { type: "email", id: "newsletter-email", value: email, onChange: (e) => {
                                    setEmail(e.target.value);
                                    setError('');
                                }, className: "w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400", placeholder: "your@email.com", required: true })] }), _jsx(Button, { type: "submit", loading: loading, className: "w-full bg-blue-600 hover:bg-blue-700 text-white", children: loading ? 'Subscribing...' : 'Subscribe to Newsletter' }), _jsx("p", { className: "text-xs text-gray-500 dark:text-slate-400 text-center", children: "We respect your privacy. Unsubscribe at any time." })] })] }));
}
export default NewsletterSignup;
