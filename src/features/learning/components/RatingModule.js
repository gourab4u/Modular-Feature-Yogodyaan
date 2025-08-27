import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Star } from 'lucide-react';
import { useState } from 'react';
export function RatingModule({ averageRating, totalRatings, userRating, onSubmitRating, className = '' }) {
    const [hoveredRating, setHoveredRating] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const handleRatingClick = async (rating) => {
        try {
            setSubmitting(true);
            await onSubmitRating(rating);
        }
        catch (error) {
            console.error('Failed to submit rating:', error);
        }
        finally {
            setSubmitting(false);
        }
    };
    const renderStars = (rating, interactive = false) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            const isFilled = i <= rating;
            const isHovered = interactive && hoveredRating !== null && i <= hoveredRating;
            stars.push(_jsx("button", { onClick: () => interactive && handleRatingClick(i), onMouseEnter: () => interactive && setHoveredRating(i), onMouseLeave: () => interactive && setHoveredRating(null), disabled: !interactive || submitting, className: `${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-all duration-200 ${interactive ? 'p-1' : ''}`, children: _jsx(Star, { className: `w-5 h-5 ${isFilled || isHovered
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-400 dark:text-slate-500'}` }) }, i));
        }
        return stars;
    };
    return (_jsxs("div", { className: `bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-600 p-6 ${className}`, children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-4", children: "Rate this Article" }), _jsxs("div", { className: "mb-6", children: [_jsxs("div", { className: "flex items-center space-x-2 mb-2", children: [_jsx("div", { className: "flex space-x-1", children: renderStars(averageRating) }), _jsx("span", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: averageRating > 0 ? averageRating.toFixed(1) : 'No ratings yet' })] }), _jsx("p", { className: "text-sm text-gray-600 dark:text-slate-300", children: totalRatings === 0
                            ? 'Be the first to rate this article!'
                            : `Based on ${totalRatings} rating${totalRatings !== 1 ? 's' : ''}` })] }), _jsxs("div", { className: "border-t border-gray-200 dark:border-slate-600 pt-6", children: [_jsx("p", { className: "text-sm font-medium text-gray-700 dark:text-slate-300 mb-3", children: userRating ? 'Your rating:' : 'Rate this article:' }), _jsx("div", { className: "flex items-center space-x-1 mb-4", children: renderStars(userRating || hoveredRating || 0, true) }), userRating && (_jsx("p", { className: "text-sm text-green-600 dark:text-green-400 mb-2", children: "Thank you for rating this article!" })), _jsx("p", { className: "text-xs text-gray-500 dark:text-slate-400", children: "Your rating helps other readers discover quality content." })] })] }));
}
