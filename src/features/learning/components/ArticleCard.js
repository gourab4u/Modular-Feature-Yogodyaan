import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Calendar, Eye, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
export function ArticleCard({ article }) {
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };
    const renderStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                stars.push(_jsx(Star, { className: "w-4 h-4 text-yellow-400 fill-current" }, i));
            }
            else if (i === fullStars && hasHalfStar) {
                stars.push(_jsxs("div", { className: "relative", children: [_jsx(Star, { className: "w-4 h-4 text-gray-300" }), _jsx("div", { className: "absolute inset-0 overflow-hidden w-1/2", children: _jsx(Star, { className: "w-4 h-4 text-yellow-400 fill-current" }) })] }, i));
            }
            else {
                stars.push(_jsx(Star, { className: "w-4 h-4 text-gray-300" }, i));
            }
        }
        return stars;
    };
    return (_jsx("article", { className: "bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl shadow-lg overflow-hidden group", children: _jsxs(Link, { to: `/learning/${article.id}`, children: [_jsxs("div", { className: "relative", children: [article.image_url && (_jsx("img", { src: article.image_url, alt: article.title, className: "w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300", loading: "lazy", onError: (e) => {
                                e.currentTarget.style.display = 'none';
                            } })), _jsx("div", { className: "absolute top-4 left-4", children: _jsx("span", { className: "bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium capitalize", children: article.category }) })] }), _jsxs("div", { className: "p-6", children: [_jsx("h3", { className: "text-xl font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2", children: article.title }), _jsx("p", { className: "text-gray-600 dark:text-slate-300 mb-4 line-clamp-3", children: article.preview_text }), _jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { className: "flex items-center space-x-1", children: [renderStars(article.average_rating), _jsx("span", { className: "text-sm text-gray-600 dark:text-slate-400 ml-2", children: article.average_rating > 0 ? article.average_rating.toFixed(1) : 'No ratings' }), article.total_ratings > 0 && (_jsxs("span", { className: "text-sm text-gray-500 dark:text-slate-500", children: ["(", article.total_ratings, ")"] }))] }), _jsx("div", { className: "flex items-center space-x-4 text-sm text-gray-500 dark:text-slate-400", children: _jsxs("div", { className: "flex items-center space-x-1", children: [_jsx(Eye, { className: "w-4 h-4 text-blue-500 dark:text-blue-400" }), _jsx("span", { children: article.view_count })] }) })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-1 text-sm text-gray-500 dark:text-slate-400", children: [_jsx(Calendar, { className: "w-4 h-4" }), _jsx("span", { children: formatDate(article.published_at || article.created_at) })] }), _jsx("button", { className: "text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors", children: "Read More \u2192" })] }), article.tags && article.tags.length > 0 && (_jsx("div", { className: "mt-4 pt-4 border-t border-gray-100 dark:border-slate-600", children: _jsxs("div", { className: "flex flex-wrap gap-2", children: [article.tags.slice(0, 3).map((tag, index) => (_jsxs("span", { className: "bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300 px-2 py-1 rounded text-xs", children: ["#", tag] }, index))), article.tags.length > 3 && (_jsxs("span", { className: "text-gray-500 dark:text-slate-400 text-xs", children: ["+", article.tags.length - 3, " more"] }))] }) }))] })] }) }));
}
