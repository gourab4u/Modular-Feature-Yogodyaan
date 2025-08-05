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
