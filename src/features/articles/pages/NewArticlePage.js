import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ArrowLeft, BookOpen, CheckCircle, PenTool, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import ArticleEditor from '../../dashboard/components/Modules/ArticleEditor';
export default function NewArticlePage({ article, onSave, onCancel, backToPath = '/learning', onBack }) {
    const navigate = useNavigate();
    const handleSave = async (data) => {
        if (onSave) {
            await onSave(data);
        }
        else {
            // Replace with real save flow if needed; this keeps contract Promise<void>
            console.log('Article saved:', data);
            navigate(backToPath);
        }
    };
    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        }
        else {
            navigate(backToPath);
        }
    };
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-900", children: [_jsx("div", { className: "border-b border-gray-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur", children: _jsx("div", { className: "max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4", children: _jsx("div", { className: "flex items-center justify-between", children: onBack ? (_jsxs("button", { type: "button", onClick: onBack, className: "inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300", children: [_jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }), "Back"] })) : (_jsxs(Link, { to: backToPath, className: "inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300", children: [_jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }), "Back to Learning"] })) }) }) }), _jsx("div", { className: "bg-white dark:bg-slate-900", children: _jsxs("div", { className: "max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6", children: [_jsx("div", { className: "flex flex-wrap items-center gap-3", children: _jsxs("span", { className: "inline-flex items-center bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-medium", children: [_jsx(PenTool, { className: "w-4 h-4 mr-1" }), "Article Creator"] }) }), _jsx("h1", { className: "mt-3 text-3xl md:text-4xl font-bold text-gray-900 dark:text-white", children: "Write a New Article" }), _jsx("p", { className: "mt-2 text-gray-600 dark:text-slate-300", children: "Share your yoga wisdom with the community. Save as draft, submit for review, or publish when ready." })] }) }), _jsx("div", { className: "max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8", children: _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-4 gap-8", children: [_jsx("div", { className: "lg:col-span-3", children: _jsx("div", { className: "bg-white dark:bg-slate-900 rounded-xl", children: _jsx(ArticleEditor, { article: article, onSave: handleSave, onCancel: handleCancel }) }) }), _jsxs("aside", { className: "space-y-6", children: [_jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-6", children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx(Sparkles, { className: "w-5 h-5 text-amber-500" }), _jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: "Tips for a great article" })] }), _jsxs("ul", { className: "space-y-3 text-sm text-gray-700 dark:text-slate-300", children: [_jsxs("li", { className: "flex items-start gap-2", children: [_jsx(CheckCircle, { className: "w-4 h-4 text-emerald-500 mt-0.5" }), "Keep the title under 60 characters and make it descriptive."] }), _jsxs("li", { className: "flex items-start gap-2", children: [_jsx(CheckCircle, { className: "w-4 h-4 text-emerald-500 mt-0.5" }), "Use Preview Text to summarize what readers will learn."] }), _jsxs("li", { className: "flex items-start gap-2", children: [_jsx(CheckCircle, { className: "w-4 h-4 text-emerald-500 mt-0.5" }), "Add an engaging cover image and relevant tags for discovery."] }), _jsxs("li", { className: "flex items-start gap-2", children: [_jsx(CheckCircle, { className: "w-4 h-4 text-emerald-500 mt-0.5" }), "Structure content with headings, lists, and short paragraphs."] })] })] }), _jsxs("div", { className: "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 rounded-xl border border-blue-100 dark:border-slate-700 p-6", children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx(BookOpen, { className: "w-5 h-5 text-blue-600 dark:text-blue-400" }), _jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: "Publishing flow" })] }), _jsxs("ol", { className: "space-y-2 text-sm text-gray-700 dark:text-slate-300 list-decimal list-inside", children: [_jsx("li", { children: "Save Draft to keep working." }), _jsx("li", { children: "Submit for Review to send to a moderator." }), _jsx("li", { children: "Publish (if allowed) or auto-publish after approval." })] })] })] })] }) })] }));
}
