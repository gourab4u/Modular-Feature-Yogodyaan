import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Filter, Search } from 'lucide-react';
export function ArticleFilters({ searchTerm, onSearchChange, selectedCategory, onCategoryChange, sortBy, onSortChange }) {
    const categories = [
        { value: 'all', label: 'All Categories' },
        { value: 'beginner', label: 'Beginner' },
        { value: 'wellness', label: 'Wellness' },
        { value: 'corporate', label: 'Corporate' },
        { value: 'advanced', label: 'Advanced' },
        { value: 'meditation', label: 'Meditation' },
        { value: 'nutrition', label: 'Nutrition' }
    ];
    const sortOptions = [
        { value: 'latest', label: 'Latest' },
        { value: 'popular', label: 'Most Popular' },
        { value: 'highest_rated', label: 'Highest Rated' }
    ];
    return (_jsx("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8", children: _jsxs("div", { className: "flex flex-col lg:flex-row gap-4", children: [_jsx("div", { className: "flex-1", children: _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" }), _jsx("input", { type: "text", placeholder: "Search articles...", value: searchTerm, onChange: (e) => onSearchChange(e.target.value), className: "w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500", id: "article-search", name: "article-search" })] }) }), _jsx("div", { className: "lg:w-48", children: _jsxs("div", { className: "relative", children: [_jsx(Filter, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" }), _jsx("select", { value: selectedCategory, onChange: (e) => onCategoryChange(e.target.value), className: "w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white", id: "category-filter", name: "category-filter", children: categories.map(category => (_jsx("option", { value: category.value, children: category.label }, category.value))) })] }) }), _jsx("div", { className: "lg:w-48", children: _jsx("select", { value: sortBy, onChange: (e) => onSortChange(e.target.value), className: "w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white", id: "sort-filter", name: "sort-filter", children: sortOptions.map(option => (_jsx("option", { value: option.value, children: option.label }, option.value))) }) })] }) }));
}
