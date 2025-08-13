import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Award, Image as ImageIcon } from 'lucide-react';
export function Achievements() {
    // Example media data; replace with your real achievements/photos
    const achievements = [
        {
            title: "International Yoga Day 2023",
            description: "Hosted a global online session with 1000+ participants.",
            image: "https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop"
        },
        {
            title: "Corporate Wellness Award",
            description: "Recognized for excellence in workplace wellness programs.",
            image: "https://images.pexels.com/photos/3823488/pexels-photo-3823488.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop"
        },
        {
            title: "Community Outreach",
            description: "Free yoga classes for underprivileged communities.",
            image: "https://images.pexels.com/photos/3823495/pexels-photo-3823495.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop"
        },
        // Add more as needed
    ];
    return (_jsxs("div", { className: "min-h-screen", children: [_jsx("section", { className: "gradient-bg text-white py-20", children: _jsxs("div", { className: "max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8", children: [_jsx(Award, { className: "w-16 h-16 mx-auto mb-4" }), _jsx("h1", { className: "text-5xl font-bold mb-6", children: "Our Achievements" }), _jsx("p", { className: "text-xl text-emerald-100", children: "Celebrating milestones and sharing moments from our journey to inspire wellness worldwide." })] }) }), _jsx("section", { className: "py-20 bg-gradient-to-br from-gray-50 to-blue-50", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [_jsxs("div", { className: "text-center mb-16", children: [_jsx("h2", { className: "text-4xl font-bold text-gray-900 mb-4", children: "Photo Gallery" }), _jsx("p", { className: "text-xl text-gray-600", children: "Explore highlights from our events, awards, and community impact." })] }), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8", children: achievements.map((item, idx) => (_jsxs("div", { className: "card p-0 overflow-hidden group", children: [_jsxs("div", { className: "relative h-64 bg-gray-100 flex items-center justify-center", children: [item.image ? (_jsx("img", { src: item.image, alt: item.title, className: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-300", loading: "lazy" })) : (_jsx(ImageIcon, { className: "w-16 h-16 text-gray-300" })), _jsx("div", { className: "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4", children: _jsx("h3", { className: "text-lg font-semibold text-white", children: item.title }) })] }), _jsx("div", { className: "p-4", children: _jsx("p", { className: "text-gray-700", children: item.description }) })] }, idx))) })] }) })] }));
}
export default Achievements;
