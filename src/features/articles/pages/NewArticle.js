import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
export function NewArticle() {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [message, setMessage] = useState('');
    const handleSubmit = (e) => {
        e.preventDefault();
        // Simulate article submission
        setMessage('Article submitted successfully!');
    };
    return (_jsx("div", { className: "min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "max-w-3xl w-full space-y-8", children: [_jsx("h2", { className: "text-3xl font-bold text-gray-900 dark:text-white text-center", children: "Write a New Article" }), message && (_jsx("div", { className: "bg-green-50 border border-green-200 rounded-lg p-3 text-green-600 text-sm", children: message })), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "title", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Title" }), _jsx("input", { type: "text", id: "title", name: "title", value: title, onChange: (e) => setTitle(e.target.value), className: "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100", placeholder: "Enter the title of your article", required: true })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "content", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Content" }), _jsx("textarea", { id: "content", name: "content", value: content, onChange: (e) => setContent(e.target.value), className: "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100", placeholder: "Write your article content here", rows: 10, required: true })] }), _jsx("button", { type: "submit", className: "w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-semibold transition-all", children: "Submit Article" })] })] }) }));
}
