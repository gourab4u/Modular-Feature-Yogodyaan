import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { ChevronDown, User, Calendar, Clock, Phone, Mail, X, Check } from 'lucide-react';
import { useState } from 'react';
export const MultipleBookingSelector = ({ bookings, selectedBookingIds, onBookingSelectionChange, bookingTypeFilter, assignmentType }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    // Filter bookings based on assignment type, booking type, course type, status, and search term
    const filteredBookings = bookings.filter(booking => {
        // Filter by status - only show pending/confirmed, not completed/cancelled/assigned
        const matchesStatus = ['pending', 'confirmed'].includes(booking.status);
        // Filter by booking type based on assignment type
        let matchesBookingType = true;
        let matchesCourseType = true;
        if (assignmentType === 'weekly') {
            // Weekly classes - show only public group bookings
            matchesBookingType = booking.booking_type === 'public_group';
            matchesCourseType = true; // Allow any course type for weekly
        }
        else if (assignmentType === 'monthly') {
            // Monthly packages should show selected booking type with regular course type
            if (bookingTypeFilter && bookingTypeFilter.trim() !== '') {
                matchesBookingType = booking.booking_type === bookingTypeFilter;
                // Filter by course_type if package exists, otherwise allow booking
                if (booking.class_packages && booking.class_packages.course_type) {
                    matchesCourseType = booking.class_packages.course_type === 'regular';
                }
                else {
                    // If no package linked, allow the booking (might be individual bookings without packages)
                    matchesCourseType = true;
                }
            }
            else {
                matchesBookingType = false; // Don't show any bookings until type is selected
            }
        }
        else if (assignmentType === 'crash_course') {
            // Crash courses should show selected booking type with crash course type
            if (bookingTypeFilter && bookingTypeFilter.trim() !== '') {
                matchesBookingType = booking.booking_type === bookingTypeFilter;
                // Filter by course_type if package exists, otherwise exclude booking for crash courses
                if (booking.class_packages && booking.class_packages.course_type) {
                    matchesCourseType = booking.class_packages.course_type === 'crash';
                }
                else {
                    // If no package linked, exclude from crash course assignments
                    matchesCourseType = false;
                }
            }
            else {
                matchesBookingType = false; // Don't show any bookings until type is selected
            }
        }
        else if (bookingTypeFilter && bookingTypeFilter.trim() !== '') {
            // For adhoc and package forms, filter by selected booking type, any course type
            matchesBookingType = booking.booking_type === bookingTypeFilter;
            // matchesCourseType remains true (any course type)
        }
        // If no booking type filter and not weekly/monthly/crash, show all booking types and course types
        const matchesSearch = !searchTerm ||
            `${booking.first_name} ${booking.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            booking.email.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesBookingType && matchesCourseType && matchesSearch;
    });
    const selectedBookings = bookings.filter(b => selectedBookingIds.includes(b.booking_id || ''));
    const handleBookingToggle = (booking) => {
        const bookingId = booking.booking_id || '';
        const newSelectedIds = selectedBookingIds.includes(bookingId)
            ? selectedBookingIds.filter(id => id !== bookingId)
            : [...selectedBookingIds, bookingId];
        onBookingSelectionChange(newSelectedIds);
    };
    const clearAllSelections = () => {
        onBookingSelectionChange([]);
        setIsOpen(false);
    };
    const formatDate = (dateString) => {
        if (!dateString)
            return 'No date';
        return new Date(dateString).toLocaleDateString();
    };
    const formatTime = (timeString) => {
        if (!timeString)
            return 'No time';
        return timeString;
    };
    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'confirmed': return 'bg-blue-100 text-blue-800';
            case 'completed': return 'bg-green-100 text-green-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    const removeBooking = (bookingId) => {
        const newSelectedIds = selectedBookingIds.filter(id => id !== bookingId);
        onBookingSelectionChange(newSelectedIds);
    };
    return (_jsxs("div", { className: "relative", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Link to Bookings (Optional)" }), _jsxs("div", { className: "relative", children: [_jsxs("button", { type: "button", onClick: () => setIsOpen(!isOpen), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-left flex items-center justify-between min-h-[40px]", children: [_jsx("span", { className: "flex-1", children: selectedBookings.length > 0 ? (_jsxs("div", { className: "flex flex-wrap gap-1", children: [selectedBookings.slice(0, 2).map((booking) => (_jsxs("span", { className: "inline-flex items-center bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full", children: [booking.first_name, " ", booking.last_name] }, booking.id))), selectedBookings.length > 2 && (_jsxs("span", { className: "inline-flex items-center bg-gray-100 text-gray-600 text-xs font-medium px-2 py-1 rounded-full", children: ["+", selectedBookings.length - 2, " more"] }))] })) : (_jsx("span", { className: "text-gray-500", children: "Select bookings..." })) }), _jsx(ChevronDown, { className: `w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}` })] }), isOpen && (_jsxs("div", { className: "absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-hidden", children: [_jsx("div", { className: "p-3 border-b border-gray-200", children: _jsx("input", { type: "text", placeholder: "Search bookings...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500", autoFocus: true }) }), _jsx("div", { className: "border-b border-gray-200", children: _jsx("button", { type: "button", onClick: clearAllSelections, className: "w-full px-3 py-2 text-left hover:bg-gray-50 text-sm text-gray-600", children: _jsx("span", { className: "italic", children: "Clear all selections" }) }) }), _jsx("div", { className: "max-h-60 overflow-y-auto", children: filteredBookings.length === 0 ? (_jsx("div", { className: "p-3 text-sm text-gray-500 text-center", children: searchTerm ? 'No bookings match your search' : 'No available bookings' })) : (filteredBookings.map((booking) => (_jsx("button", { type: "button", onClick: () => handleBookingToggle(booking), className: `w-full px-3 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${selectedBookingIds.includes(booking.booking_id || '') ? 'bg-blue-50' : ''}`, children: _jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: `w-4 h-4 mr-2 border-2 rounded flex items-center justify-center ${selectedBookingIds.includes(booking.booking_id || '')
                                                                    ? 'bg-blue-600 border-blue-600'
                                                                    : 'border-gray-300'}`, children: selectedBookingIds.includes(booking.booking_id || '') && (_jsx(Check, { className: "w-3 h-3 text-white" })) }), _jsx(User, { className: "w-4 h-4 mr-2 text-gray-400" }), _jsxs("span", { className: "font-medium text-gray-900", children: [booking.first_name, " ", booking.last_name] })] }), _jsx("span", { className: `px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`, children: booking.status })] }), _jsxs("div", { className: "flex items-center text-sm text-gray-600 ml-6", children: [_jsx(Mail, { className: "w-3 h-3 mr-1" }), _jsx("span", { className: "mr-3", children: booking.email }), booking.phone && (_jsxs(_Fragment, { children: [_jsx(Phone, { className: "w-3 h-3 mr-1" }), _jsx("span", { children: booking.phone })] }))] }), _jsxs("div", { className: "text-sm text-gray-600 ml-6", children: [_jsx("span", { className: "font-medium", children: "Class:" }), " ", booking.class_name || 'Unknown'] }), (booking.preferred_days?.length || booking.preferred_times?.length || booking.class_date || booking.class_time) && (_jsx("div", { className: "text-sm text-gray-600 ml-6", children: booking.preferred_days?.length && booking.preferred_times?.length ? (_jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(Calendar, { className: "w-3 h-3 mr-1" }), _jsx("span", { className: "font-medium", children: "Preferred Days:" })] }), _jsx("div", { className: "ml-4 space-y-0.5", children: booking.preferred_days.map((day, index) => (_jsxs("div", { className: "flex items-center", children: [_jsx("span", { className: "mr-2", children: day }), booking.preferred_times?.[index] && (_jsxs(_Fragment, { children: [_jsx(Clock, { className: "w-3 h-3 mr-1" }), _jsx("span", { children: formatTime(booking.preferred_times[index]) })] })), booking.timezone && (_jsxs("span", { className: "ml-1 text-xs text-gray-500", children: ["(", booking.timezone, ")"] }))] }, index))) })] })) : (
                                                /* Fallback to single date/time for backward compatibility */
                                                _jsxs("div", { className: "flex items-center", children: [_jsx(Calendar, { className: "w-3 h-3 mr-1" }), _jsx("span", { className: "mr-2", children: formatDate(booking.class_date) }), booking.class_time && (_jsxs(_Fragment, { children: [_jsx(Clock, { className: "w-3 h-3 mr-1" }), _jsx("span", { children: formatTime(booking.class_time) })] }))] })) }))] }) }, booking.id)))) })] }))] }), selectedBookings.length > 0 && (_jsx("div", { className: "mt-2 p-3 bg-blue-50 rounded-md border border-blue-200", children: _jsxs("div", { className: "text-sm", children: [_jsxs("div", { className: "font-medium text-blue-900 mb-2", children: ["Selected Bookings (", selectedBookings.length, "):"] }), _jsx("div", { className: "space-y-2", children: selectedBookings.map((booking) => (_jsxs("div", { className: "flex items-center justify-between text-blue-800 bg-white rounded px-2 py-1", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { children: [_jsxs("strong", { children: [booking.first_name, " ", booking.last_name] }), " - ", booking.email] }), _jsx("div", { className: "text-xs", children: booking.class_name || 'Unknown' }), (booking.preferred_days?.length || booking.preferred_times?.length || booking.class_date || booking.class_time) && (_jsx("div", { className: "text-xs text-blue-600 mt-1", children: booking.preferred_days?.length && booking.preferred_times?.length ? (_jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(Calendar, { className: "w-3 h-3 mr-1" }), _jsx("span", { className: "font-medium", children: "Preferred Days:" })] }), _jsx("div", { className: "ml-4 space-y-0.5", children: booking.preferred_days.map((day, index) => (_jsxs("div", { className: "flex items-center", children: [_jsx("span", { className: "mr-2", children: day }), booking.preferred_times?.[index] && (_jsxs(_Fragment, { children: [_jsx(Clock, { className: "w-3 h-3 mr-1" }), _jsx("span", { children: formatTime(booking.preferred_times[index]) })] })), booking.timezone && (_jsxs("span", { className: "ml-1 text-xs text-blue-500", children: ["(", booking.timezone, ")"] }))] }, index))) })] })) : (
                                                /* Fallback to single date/time for backward compatibility */
                                                _jsxs("div", { className: "flex items-center", children: [_jsx(Calendar, { className: "w-3 h-3 mr-1" }), _jsx("span", { className: "mr-2", children: formatDate(booking.class_date) }), booking.class_time && (_jsxs(_Fragment, { children: [_jsx(Clock, { className: "w-3 h-3 mr-1" }), _jsx("span", { children: formatTime(booking.class_time) })] }))] })) }))] }), _jsx("button", { type: "button", onClick: () => removeBooking(booking.booking_id || ''), className: "ml-2 text-red-600 hover:text-red-800", children: _jsx(X, { className: "w-4 h-4" }) })] }, booking.id))) })] }) }))] }));
};
