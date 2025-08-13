import { useState } from 'react';
import { Button } from '../../../shared/components/ui/Button';
import { supabase } from '../../../shared/lib/supabase';

export function ResetPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleResetPassword = async (e: React.FormEvent) => {
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
        } catch (err: any) {
            setError(err.message || 'An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Reset Your Password
                    </h2>
                    <p className="mt-2 text-gray-600 dark:text-gray-300">
                        Enter your email address to receive a password reset link.
                    </p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-6">
                    {message && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <p className="text-green-600 text-sm">{message}</p>
                        </div>
                    )}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-red-600 text-sm">{error}</p>
                        </div>
                    )}

                    <div>
                        <label
                            htmlFor="email"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                        >
                            Email Address
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <Button type="submit" loading={loading} className="w-full">
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </Button>
                </form>
            </div>
        </div>
    );
}
