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
        const init = async () => {
            try {
                // Establish session from URL (Supabase recovery flow)
                const url = new URL(window.location.href);
                const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
                const search = url.searchParams;

                const access_token = hash.get('access_token') || search.get('access_token');
                const refresh_token = hash.get('refresh_token') || search.get('refresh_token');
                const code = search.get('code');

                if (access_token && refresh_token) {
                    const { error } = await supabase.auth.setSession({ access_token, refresh_token });
                    if (error) throw error;
                    // Clean URL after setting the session
                    history.replaceState(null, '', url.pathname);
                } else if (code) {
                    // Some projects send a code param instead
                    const { error } = await supabase.auth.exchangeCodeForSession(code);
                    if (error) throw error;
                    history.replaceState(null, '', url.pathname);
                }

                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    setError('Auth session missing! Open the reset link from your email again.');
                }
            } catch (e: any) {
                setError(e?.message || 'Unable to initialize password reset session.');
            }
        };
        init();
    }, []);

    const handleUpdatePassword = async (e: React.FormEvent) => {
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
                        Update Your Password
                    </h2>
                    <p className="mt-2 text-gray-600 dark:text-gray-300">
                        Enter your new password below.
                    </p>
                </div>

                <form onSubmit={handleUpdatePassword} className="space-y-6">
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
                            htmlFor="password"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                        >
                            New Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            placeholder="Enter your new password"
                            required
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="confirmPassword"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                        >
                            Confirm New Password
                        </label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            placeholder="Confirm your new password"
                            required
                        />
                    </div>

                    {!message && (
                        <Button type="submit" loading={loading} className="w-full">
                            {loading ? 'Updating...' : 'Update Password'}
                        </Button>
                    )}
                </form>
            </div>
        </div>
    );
}
