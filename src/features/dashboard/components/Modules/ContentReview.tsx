import { AlertCircle, Check, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../../../../shared/components/ui/Button';
import { LoadingSpinner } from '../../../../shared/components/ui/LoadingSpinner';
import { supabase } from '../../../../shared/lib/supabase';
import { useAuth } from '../../../auth/contexts/AuthContext';
import { Article } from '../../../learning/types/article';

export function ContentReview() {
    const [pendingArticles, setPendingArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        fetchPendingArticles();
    }, []);

    const fetchPendingArticles = async () => {
        try {
            setLoading(true);

            console.log('Fetching pending articles...');

            const { data, error } = await supabase
                .from('articles')
                .select('*, author:profiles!articles_author_id_fkey(full_name, email)')
                .eq('status', 'pending_review')
                .order('created_at', { ascending: false });

            console.log('Query result:', { data, error });

            if (error) throw error;
            setPendingArticles(data || []);
        } catch (error) {
            console.error('Error fetching pending articles:', error);
        } finally {
            setLoading(false);
        }
    };
    const handleReview = async (action: 'approve' | 'reject') => {
        try {
            const { error } = await supabase
                .from('articles')
                .update({
                    status: action === 'approve' ? 'approved' : 'rejected',
                    moderation_status: action === 'approve' ? 'approved' : 'rejected',
                    moderated_at: new Date().toISOString(),
                    moderated_by: user.id // Assuming you have the current user's ID
                })
                .eq('id', article.id);

            if (error) throw error;

            // Show success message
            toast.success(`Article ${action === 'approve' ? 'approved' : 'rejected'} successfully`);

            // Redirect or update UI as needed
            router.push('/admin/content');
        } catch (error) {
            console.error(`Error updating article status:`, error);
            toast.error(`Failed to ${action} article`);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Content Review</h2>
                <div className="text-sm text-gray-500">
                    {pendingArticles.length} article{pendingArticles.length !== 1 ? 's' : ''} pending review
                </div>
            </div>

            {pendingArticles.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl shadow-lg">
                    <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No articles to review</h3>
                    <p className="text-gray-600">All submitted articles have been reviewed.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Article</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {pendingArticles.map((article) => (
                                    <tr key={article.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                {article.image_url && (
                                                    <img
                                                        src={article.image_url}
                                                        alt=""
                                                        className="w-12 h-12 rounded object-cover mr-4"
                                                    />
                                                )}
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900 line-clamp-1">{article.title}</div>
                                                    <div className="text-sm text-gray-500 line-clamp-1">{article.preview_text}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {article.author?.full_name || article.author?.email || 'Unknown author'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(article.created_at)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex space-x-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() => window.open(`/preview/${article.id}`, '_blank')}
                                                    variant="outline"
                                                >
                                                    Preview
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleReview(article.id, true)}
                                                    className="bg-green-600 hover:bg-green-700"
                                                >
                                                    <Check className="w-4 h-4 mr-1" /> Approve
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleReview(article.id, false)}
                                                    className="bg-red-600 hover:bg-red-700"
                                                >
                                                    <X className="w-4 h-4 mr-1" /> Reject
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ContentReview;