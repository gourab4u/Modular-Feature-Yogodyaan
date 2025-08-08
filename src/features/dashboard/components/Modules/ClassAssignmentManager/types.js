// Helper functions for working with the new multiple booking structure
export const getClientNames = (assignment) => {
    if (!assignment.assignment_bookings?.length) {
        return '';
    }
    const names = assignment.assignment_bookings
        .map(ab => ab.booking ? `${ab.booking.first_name} ${ab.booking.last_name}`.trim() : '')
        .filter(name => name !== '');
    return names.join(', ');
};
// New helper function for primary client + count display
export const getPrimaryClientDisplay = (assignment) => {
    if (!assignment.assignment_bookings?.length) {
        return '';
    }
    const names = assignment.assignment_bookings
        .map(ab => ab.booking ? `${ab.booking.first_name} ${ab.booking.last_name}`.trim() : '')
        .filter(name => name !== '');
    if (names.length === 0)
        return '';
    if (names.length === 1)
        return names[0];
    return `${names[0]} + ${names.length - 1} others`;
};
// Helper function to get detailed booking information
export const getBookingDetails = (assignment) => {
    if (!assignment.assignment_bookings?.length) {
        return [];
    }
    return assignment.assignment_bookings
        .map(ab => ({
        name: ab.booking ? `${ab.booking.first_name} ${ab.booking.last_name}`.trim() : '',
        email: ab.booking?.email || '',
        bookingId: ab.booking_id
    }))
        .filter(detail => detail.name !== '');
};
export const getClientEmails = (assignment) => {
    if (!assignment.assignment_bookings?.length) {
        return '';
    }
    const emails = assignment.assignment_bookings
        .map(ab => ab.booking?.email || '')
        .filter(email => email !== '');
    return emails.join(', ');
};
export const getBookingIds = (assignment) => {
    if (!assignment.assignment_bookings?.length) {
        return [];
    }
    return assignment.assignment_bookings.map(ab => ab.booking_id);
};
