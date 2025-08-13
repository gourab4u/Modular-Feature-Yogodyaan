// Class rating related shared types

export interface ClassRating {
    id: string;
    assignment_id: string;
    member_id: string;
    rating: number;         // 1-5
    comment: string | null;
    created_at: string;     // ISO
    updated_at: string;     // ISO
}

export interface RatingAggregate {
    assignment_id: string;
    avg_rating: number;
    rating_count: number;
}

export interface UserRatingWithAggregate {
    userRating: ClassRating | null;
    aggregate: RatingAggregate | null;
}

// Helper guard
export function isValidRating(value: number): boolean {
    return Number.isInteger(value) && value >= 1 && value <= 5;
}
