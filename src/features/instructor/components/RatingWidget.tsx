import React, { useState } from 'react';
import { useClassRating } from '../hooks/useClassRating';

interface RatingWidgetProps {
    assignmentId: string;
    size?: number;              // pixel size of star
    readOnly?: boolean;
    showAggregate?: boolean;
    className?: string;
    onSubmitted?: (id: string) => void;
}

const Star: React.FC<{
    filled: boolean;
    hover: boolean;
    onClick?: () => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    size: number;
    disabled: boolean;
}> = ({ filled, hover, onClick, onMouseEnter, onMouseLeave, size, disabled }) => {
    const color = filled || hover ? 'text-yellow-400 dark:text-yellow-300' : 'text-gray-300 dark:text-slate-600';
    return (
        <button
            type="button"
            onClick={disabled ? undefined : onClick}
            onMouseEnter={disabled ? undefined : onMouseEnter}
            onMouseLeave={disabled ? undefined : onMouseLeave}
            className={`p-0.5 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} focus:outline-none`}
            aria-label="rate-star"
            disabled={disabled}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className={`${color}`}
                style={{ width: size, height: size }}
            >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.802 2.036a1 1 0 00-.364 1.118l1.07 3.292c.3.922-.755 1.688-1.54 1.118L10.95 14.347a1 1 0 00-1.175 0L6.615 16.283c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81H7.03a1 1 0 00.95-.69l1.07-3.292z" />
            </svg>
        </button>
    );
};

/**
 * RatingWidget
 * - Displays current user rating (if any)
 * - Allows selecting 1-5 stars when eligible
 * - Shows aggregate avg/count optionally
 */
export const RatingWidget: React.FC<RatingWidgetProps> = ({
    assignmentId,
    size = 24,
    readOnly = false,
    showAggregate = true,
    className = '',
    onSubmitted
}) => {
    const {
        userRating,
        aggregate,
        loading,
        submitting,
        error,
        eligible,
        submit
    } = useClassRating(assignmentId);

    const [hoverValue, setHoverValue] = useState<number | null>(null);
    const [localRating, setLocalRating] = useState<number | null>(null);
    const [comment, setComment] = useState('');

    const currentRating = localRating ?? userRating?.rating ?? 0;
    const disabled = readOnly || !eligible || submitting || loading;

    const handleSelect = async (value: number) => {
        if (disabled) return;
        setLocalRating(value);
    };

    const handleSubmit = async () => {
        if (disabled) return;
        try {
            const finalValue = currentRating;
            if (!finalValue) throw new Error('Select a rating first');
            const res = await submit(finalValue, comment.trim() || null);
            setComment('');
            setLocalRating(null);
            if (onSubmitted) onSubmitted(res.id);
        } catch (e) {
            // errors surfaced via hook error
        }
    };

    return (
        <div className={`flex flex-col gap-2 ${className}`} data-eligible={eligible}>
            <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map(v => (
                    <Star
                        key={v}
                        filled={v <= (hoverValue ?? currentRating)}
                        hover={hoverValue !== null && v <= hoverValue}
                        size={size}
                        onClick={() => handleSelect(v)}
                        onMouseEnter={() => setHoverValue(v)}
                        onMouseLeave={() => setHoverValue(null)}
                        disabled={disabled}
                    />
                ))}
                {loading && (
                    <span className="text-xs text-gray-500 dark:text-slate-400">Loading...</span>
                )}
                {!loading && readOnly && userRating && (
                    <span className="text-xs text-gray-500 dark:text-slate-400">You rated {userRating.rating}/5</span>
                )}
                {!loading && !readOnly && !eligible && (
                    <span className="text-xs text-gray-500 dark:text-slate-500">Not eligible yet</span>
                )}
            </div>

            {!readOnly && eligible && (
                <div className="flex flex-col gap-2">
                    <textarea
                        placeholder="Optional comment"
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        className="w-full text-sm px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 resize-none"
                        rows={2}
                        disabled={submitting}
                    />
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={submitting || !currentRating}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium text-white transition
                ${submitting || !currentRating
                                    ? 'bg-gray-400 dark:bg-slate-600 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
                                }`}
                        >
                            {submitting ? 'Saving...' : userRating ? 'Update Rating' : 'Submit Rating'}
                        </button>
                        {userRating && !submitting && (
                            <span className="text-xs text-gray-500 dark:text-slate-400">Current: {userRating.rating}/5</span>
                        )}
                    </div>
                </div>
            )}

            {showAggregate && aggregate && (
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-slate-400">
                    <span>Avg: {aggregate.avg_rating.toFixed(2)}</span>
                    <span className="text-gray-400 dark:text-slate-500">|</span>
                    <span>{aggregate.rating_count} {aggregate.rating_count === 1 ? 'rating' : 'ratings'}</span>
                </div>
            )}

            {error && (
                <div className="text-xs text-red-600 dark:text-red-400">{error}</div>
            )}
        </div>
    );
};
