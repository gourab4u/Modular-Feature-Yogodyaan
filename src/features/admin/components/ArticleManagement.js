import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BarChart3, Edit, Eye, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../../../shared/components/ui/Button';
import { LoadingSpinner } from '../../../shared/components/ui/LoadingSpinner';
import { supabase } from '../../../shared/lib/supabase';
import { useAuth } from '../../auth/contexts/AuthContext';
import { ArticleEditor } from './ArticleEditor';
export function ArticleManagement({ authorId }) {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showEditor, setShowEditor] = useState(false);
    const [editingArticle, setEditingArticle] = useState(null);
    const [saving, setSaving] = useState(false);
    const { user, isMantraCurator } = useAuth();
    useEffect(() => {
        fetchArticles();
    }, []);
    const fetchArticles = async () => {
        try {
            setLoading(true);
            // Build query based on whether we're filtering by author
            let query = supabase.from('articles').select('*');
            // If authorId is provided or user is a mantra curator, filter by author
            if (authorId) {
                query = query.eq('author_id', authorId);
            }
            else if (isMantraCurator && user) {
                // Mantra curators can only see their own articles
                query = query.eq('author_id', user.id);
            }
            // Sort by created date
            query = query.order('created_at', { ascending: false });
            const { data, error } = await query;
            if (error)
                throw error;
            setArticles(data || []);
        }
        catch (error) {
            console.error('Error fetching articles:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const handleSaveArticle = async (articleData) => {
        try {
            setSaving(true);
            if (editingArticle) {
                // Update existing article
                // Ensure we only update articles the user owns (for mantra curators)
                let query = supabase
                    .from('articles')
                    .update(articleData)
                    .eq('id', editingArticle.id);
                // Add author check for mantra curators
                if (isMantraCurator && user) {
                    query = query.eq('author_id', user.id);
                }
                const { error } = await query;
                if (error)
                    throw error;
            }
            else {
                // Create new article
                // Set author_id if user is a mantra curator
                const newArticleData = {
                    ...articleData,
                    author_id: user?.id || null
                };
                const { error } = await supabase
                    .from('articles')
                    .insert([newArticleData]);
                if (error)
                    throw error;
            }
            await fetchArticles();
            setShowEditor(false);
            setEditingArticle(null);
        }
        catch (error) {
            console.error('Error saving article:', error);
            throw error;
        }
        finally {
            setSaving(false);
        }
    };
    const handleDeleteArticle = async (id) => {
        if (!confirm('Are you sure you want to delete this article?'))
            return;
        try {
            // Start building the query
            let query = supabase
                .from('articles')
                .delete()
                .eq('id', id);
            // Add author check for mantra curators
            if (isMantraCurator && user) {
                query = query.eq('author_id', user.id);
            }
            const { error } = await query;
            if (error)
                throw error;
            await fetchArticles();
        }
        catch (error) {
            console.error('Error deleting article:', error);
        }
    };
    const handleEditArticle = (article) => {
        setEditingArticle(article);
        setShowEditor(true);
    };
    const handleCreateNew = () => {
        setEditingArticle(null);
        setShowEditor(true);
    };
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };
    if (showEditor) {
        return (_jsx(ArticleEditor, { article: editingArticle || undefined, onSave: handleSaveArticle, onCancel: () => {
                setShowEditor(false);
                setEditingArticle(null);
            }, loading: saving }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900", children: "Article Management" }), _jsxs(Button, { onClick: handleCreateNew, className: "flex items-center", children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), "Create New Article"] })] }), loading ? (_jsx("div", { className: "flex justify-center py-12", children: _jsx(LoadingSpinner, { size: "lg" }) })) : (_jsxs("div", { className: "bg-white rounded-xl shadow-lg overflow-hidden", children: [_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Article" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Category" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Status" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Views" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Created" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Actions" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: articles.map((article) => (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-6 py-4", children: _jsxs("div", { className: "flex items-center", children: [article.image_url && (_jsx("img", { src: article.image_url, alt: "", className: "w-12 h-12 rounded object-cover mr-4" })), _jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium text-gray-900 line-clamp-1", children: article.title }), _jsx("div", { className: "text-sm text-gray-500 line-clamp-2", children: article.preview_text })] })] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("span", { className: "bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium capitalize", children: article.category }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("span", { className: `px-2 py-1 rounded text-xs font-medium ${article.status === 'published'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-yellow-100 text-yellow-800'}`, children: article.status }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: _jsxs("div", { className: "flex items-center", children: [_jsx(Eye, { className: "w-4 h-4 mr-1 text-gray-400" }), article.view_count] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500", children: formatDate(article.created_at) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm font-medium", children: _jsxs("div", { className: "flex space-x-2", children: [article.status === 'published' && (_jsx("a", { href: `/learning/${article.id}`, target: "_blank", rel: "noopener noreferrer", className: "text-blue-600 hover:text-blue-900", children: _jsx(Eye, { className: "w-4 h-4" }) })), _jsx("button", { onClick: () => handleEditArticle(article), className: "text-indigo-600 hover:text-indigo-900", children: _jsx(Edit, { className: "w-4 h-4" }) }), _jsx("button", { onClick: () => handleDeleteArticle(article.id), className: "text-red-600 hover:text-red-900", children: _jsx(Trash2, { className: "w-4 h-4" }) })] }) })] }, article.id))) })] }) }), articles.length === 0 && (_jsxs("div", { className: "text-center py-12", children: [_jsx(BarChart3, { className: "w-16 h-16 text-gray-400 mx-auto mb-4" }), _jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-2", children: "No articles yet" }), _jsx("p", { className: "text-gray-600 mb-4", children: "Create your first article to get started." }), _jsxs(Button, { onClick: handleCreateNew, children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), "Create Article"] })] }))] }))] }));
}
