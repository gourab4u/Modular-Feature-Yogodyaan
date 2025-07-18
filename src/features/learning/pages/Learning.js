import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Award, BookOpen, TrendingUp } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { LoadingSpinner } from '../../../shared/components/ui/LoadingSpinner';
import { ArticleCard } from '../components/ArticleCard';
import { ArticleFilters } from '../components/ArticleFilters';
import { useArticles } from '../hooks/useArticles';
export function Learning() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [sortBy, setSortBy] = useState('latest');
    const { articles, loading, error, refetch } = useArticles();
    // Memoize filtered articles to prevent unnecessary re-renders
    const filteredArticles = useMemo(() => {
        return articles.filter(article => {
            const matchesSearch = searchTerm === '' ||
                article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                article.preview_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [articles, searchTerm, selectedCategory]);
    // Refetch when filters change (but not search term)
    useEffect(() => {
        refetch({
            category: selectedCategory,
            sortBy: sortBy
        });
    }, [selectedCategory, sortBy, refetch]);
    // Memoize stats to prevent recalculation
    const stats = useMemo(() => [
        {
            icon: _jsx(BookOpen, { className: "w-8 h-8 text-blue-600" }),
            title: "Total Articles",
            value: articles.length.toString(),
            description: "Comprehensive yoga guides"
        },
        {
            icon: _jsx(TrendingUp, { className: "w-8 h-8 text-green-600" }),
            title: "Most Popular",
            value: articles.length > 0 ? Math.max(...articles.map(a => a.view_count)).toString() : "0",
            description: "Views on top article"
        },
        {
            icon: _jsx(Award, { className: "w-8 h-8 text-yellow-600" }),
            title: "Highest Rated",
            value: articles.length > 0 ? Math.max(...articles.map(a => a.average_rating)).toFixed(1) : "0",
            description: "Average rating"
        }
    ], [articles]);
    if (error) {
        return (_jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsxs("p", { className: "text-red-600 mb-4", children: ["Failed to load articles: ", error] }), _jsx("button", { onClick: () => refetch(), className: "btn-primary", children: "Try Again" })] }) }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx("section", { className: "bg-gradient-to-br from-blue-50 via-white to-green-50 py-20", children: _jsxs("div", { className: "max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8", children: [_jsx("h1", { className: "text-5xl font-bold text-gray-900 mb-6", children: "Yoga Learning Center" }), _jsx("p", { className: "text-xl text-gray-600 leading-relaxed", children: "Discover comprehensive guides, expert insights, and practical tips to deepen your yoga practice. From beginner fundamentals to advanced techniques, find everything you need for your wellness journey." })] }) }), _jsx("section", { className: "py-16 bg-white", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-8", children: stats.map((stat, index) => (_jsxs("div", { className: "text-center p-6 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all duration-300", children: [_jsx("div", { className: "flex justify-center mb-4", children: stat.icon }), _jsx("div", { className: "text-3xl font-bold text-gray-900 mb-2", children: stat.value }), _jsx("div", { className: "text-lg font-semibold text-gray-700 mb-1", children: stat.title }), _jsx("div", { className: "text-gray-600 text-sm", children: stat.description })] }, index))) }) }) }), _jsx("section", { className: "py-20", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [_jsx(ArticleFilters, { searchTerm: searchTerm, onSearchChange: setSearchTerm, selectedCategory: selectedCategory, onCategoryChange: setSelectedCategory, sortBy: sortBy, onSortChange: setSortBy }), loading && (_jsx("div", { className: "flex justify-center py-12", children: _jsx(LoadingSpinner, { size: "lg" }) })), !loading && (_jsx(_Fragment, { children: filteredArticles.length === 0 ? (_jsxs("div", { className: "text-center py-12", children: [_jsx(BookOpen, { className: "w-16 h-16 text-gray-400 mx-auto mb-4" }), _jsx("h3", { className: "text-xl font-semibold text-gray-900 mb-2", children: "No articles found" }), _jsx("p", { className: "text-gray-600", children: searchTerm || selectedCategory !== 'all'
                                            ? 'Try adjusting your search or filter criteria.'
                                            : 'Check back soon for new content!' })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex justify-between items-center mb-8", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900", children: searchTerm ? `Search results for "${searchTerm}"` : 'Latest Articles' }), _jsxs("p", { className: "text-gray-600", children: [filteredArticles.length, " article", filteredArticles.length !== 1 ? 's' : '', " found"] })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8", children: filteredArticles.map((article) => (_jsx(ArticleCard, { article: article }, article.id))) })] })) }))] }) }), _jsx("section", { className: "py-20 bg-gradient-to-r from-blue-600 to-green-600 text-white", children: _jsxs("div", { className: "max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8", children: [_jsx("h2", { className: "text-4xl font-bold mb-6", children: "Ready to Start Your Practice?" }), _jsx("p", { className: "text-xl mb-8 text-blue-100", children: "Take your learning to the next level with personalized yoga sessions. Book a class with our expert instructors today." }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-4 justify-center", children: [_jsx("a", { href: "/services", className: "bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-300 hover:scale-105 inline-block", children: "Book Your Class" }), _jsx("a", { href: "/contact", className: "border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-300 inline-block", children: "Ask Questions" })] })] }) })] }));
}
