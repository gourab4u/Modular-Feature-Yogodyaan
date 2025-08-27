import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BookingSelector } from './BookingSelector';
import { MultipleBookingSelector } from './MultipleBookingSelector';
export const AdaptiveBookingSelector = ({ bookings, assignmentType, bookingType, selectedBookingId = '', onBookingSelect, selectedBookingIds = [], onBookingSelectionChange, bookingTypeFilter }) => {
    // Determine if this assignment type allows multiple bookings
    const allowsMultipleBookings = shouldAllowMultipleBookings(assignmentType, bookingType);
    if (allowsMultipleBookings) {
        // Use MultipleBookingSelector for weekly, corporate, monthly, crash courses
        return (_jsxs("div", { children: [_jsx(MultipleBookingSelector, { bookings: bookings, selectedBookingIds: selectedBookingIds, onBookingSelectionChange: onBookingSelectionChange || (() => { }), assignmentType: assignmentType, bookingTypeFilter: bookingTypeFilter }), _jsx("div", { className: "mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md", children: _jsxs("p", { className: "text-sm text-blue-700", children: [_jsx("strong", { children: "Multiple bookings allowed:" }), " You can select multiple bookings for ", bookingType, " classes. Each booking represents one student."] }) })] }));
    }
    else {
        // Use single BookingSelector for individual and private group classes
        return (_jsxs("div", { children: [_jsx(BookingSelector, { bookings: bookings, selectedBookingId: selectedBookingId, onBookingSelect: onBookingSelect || (() => { }), assignmentType: assignmentType, bookingTypeFilter: bookingTypeFilter }), _jsx("div", { className: "mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md", children: _jsxs("p", { className: "text-sm text-amber-700", children: [_jsx("strong", { children: "Single booking only:" }), " ", bookingType === 'individual' ? 'Individual booking type allows only one booking.' : 'Individual and private group classes can only be linked to one booking.'] }) })] }));
    }
};
// Helper function to determine if assignment type allows multiple bookings
const shouldAllowMultipleBookings = (assignmentType, bookingType) => {
    // Individual booking type: single booking only regardless of assignment type
    if (bookingType === 'individual') {
        return false;
    }
    // Private group classes: single booking only (for adhoc assignments)
    if (assignmentType === 'adhoc' && bookingType === 'private_group') {
        return false;
    }
    // All other cases: multiple bookings allowed
    // - Weekly classes (public_group)
    // - Corporate bookings
    // - Monthly packages (corporate, private_group, public_group)
    // - Crash courses (corporate, private_group, public_group)
    return true;
};
