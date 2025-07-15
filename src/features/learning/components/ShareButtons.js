import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Facebook, Linkedin, Link as LinkIcon, Share2, Twitter } from 'lucide-react';
import { useState } from 'react';
export function ShareButtons({ title, url, className = '' }) {
    const [copied, setCopied] = useState(false);
    const shareData = {
        title,
        url: window.location.origin + url,
        text: `Check out this article: ${title}`
    };
    const handleNativeShare = async () => {
        if (typeof navigator.share === 'function') {
            try {
                await navigator.share(shareData);
            }
            catch (error) {
                console.log('Error sharing:', error);
            }
        }
    };
    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareData.url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
        catch (error) {
            console.error('Failed to copy link:', error);
        }
    };
    const shareUrls = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.url)}`,
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.text)}&url=${encodeURIComponent(shareData.url)}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareData.url)}`
    };
    return (_jsxs("div", { className: `bg-white rounded-xl shadow-lg p-6 ${className}`, children: [_jsxs("h3", { className: "text-lg font-semibold text-gray-900 mb-4 flex items-center", children: [_jsx(Share2, { className: "w-5 h-5 mr-2" }), "Share this Article"] }), _jsxs("div", { className: "space-y-3", children: [typeof navigator.share === 'function' && (_jsxs("button", { onClick: handleNativeShare, className: "w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors", children: [_jsx(Share2, { className: "w-4 h-4" }), _jsx("span", { children: "Share" })] })), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("a", { href: shareUrls.facebook, target: "_blank", rel: "noopener noreferrer", className: "flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors", children: [_jsx(Facebook, { className: "w-4 h-4" }), _jsx("span", { children: "Facebook" })] }), _jsxs("a", { href: shareUrls.twitter, target: "_blank", rel: "noopener noreferrer", className: "flex items-center justify-center space-x-2 px-4 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors", children: [_jsx(Twitter, { className: "w-4 h-4" }), _jsx("span", { children: "Twitter" })] })] }), _jsxs("a", { href: shareUrls.linkedin, target: "_blank", rel: "noopener noreferrer", className: "w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors", children: [_jsx(Linkedin, { className: "w-4 h-4" }), _jsx("span", { children: "LinkedIn" })] }), _jsxs("button", { onClick: handleCopyLink, className: `w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-colors ${copied
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`, children: [_jsx(LinkIcon, { className: "w-4 h-4" }), _jsx("span", { children: copied ? 'Copied!' : 'Copy Link' })] })] })] }));
}
