// Class rating related shared types
// Helper guard
export function isValidRating(value) {
    return Number.isInteger(value) && value >= 1 && value <= 5;
}
