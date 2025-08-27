import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { ChevronDown, User, Calendar, Clock, Phone, Mail } from 'lucide-react';
import { useState, useEffect } from 'react';
export const BookingSelector = ({ bookings, selectedBookingId, onBookingSelect, bookingTypeFilter, assignmentType }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    // Close dropdown and clear search when assignment type changes
    useEffect(() => {
        setIsOpen(false);
        setSearchTerm('');
    }, [assignmentType]);
    // Filter bookings based on assignment type, booking type, course type, status, and search term
    const filteredBookings = bookings.filter(booking => {
        // Only show bookings that have a booking_id (required for foreign key constraint)
        if (!booking.booking_id || booking.booking_id.trim() === '') {
            return false;
        }
        // Filter by status - only show pending/confirmed, not completed/cancelled/assigned
        const matchesStatus = ['pending', 'confirmed'].includes(booking.status);
        // Filter by booking type based on assignment type
        let matchesBookingType = true;
        let matchesCourseType = true;
        if (assignmentType === 'weekly') {
            // Weekly classes - show only public group bookings
            // Also include bookings where booking_type is null/undefined as a fallback
            matchesBookingType = booking.booking_type === 'public_group' ||
                (!booking.booking_type && booking.status === 'confirmed');
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
                // Filter by course_type if package exists
                if (booking.class_packages && booking.class_packages.course_type) {
                    matchesCourseType = booking.class_packages.course_type === 'crash';
                }
                else if (booking.class_package_id) {
                    // If package ID exists but package data not loaded, allow it (will be filtered at runtime)
                    matchesCourseType = true;
                }
                else {
                    // If no package linked at all, exclude from crash course assignments
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
    // Debug logging for weekly assignments
    if (assignmentType === 'weekly') {
        console.log('Weekly assignment booking debug:', {
            totalBookings: bookings.length,
            publicGroupBookings: bookings.filter(b => b.booking_type === 'public_group').length,
            pendingConfirmedBookings: bookings.filter(b => ['pending', 'confirmed'].includes(b.status)).length,
            publicGroupPendingConfirmed: bookings.filter(b => b.booking_type === 'public_group' && ['pending', 'confirmed'].includes(b.status)).length,
            filteredCount: filteredBookings.length,
            bookingTypes: [...new Set(bookings.map(b => b.booking_type))],
            statuses: [...new Set(bookings.map(b => b.status))]
        });
    }
    // Debug logging for crash course assignments  
    if (assignmentType === 'crash_course') {
        console.log('Crash course assignment booking debug:', {
            totalBookings: bookings.length,
            corporateBookings: bookings.filter(b => b.booking_type === 'corporate').length,
            pendingConfirmedBookings: bookings.filter(b => ['pending', 'confirmed'].includes(b.status)).length,
            corporatePendingConfirmed: bookings.filter(b => b.booking_type === 'corporate' && ['pending', 'confirmed'].includes(b.status)).length,
            bookingsWithPackageId: bookings.filter(b => b.class_package_id).length,
            bookingsWithCrashPackage: bookings.filter(b => b.class_packages?.course_type === 'crash').length,
            filteredCount: filteredBookings.length,
            bookingTypeFilter: bookingTypeFilter,
            bookingTypes: [...new Set(bookings.map(b => b.booking_type))],
            statuses: [...new Set(bookings.map(b => b.status))],
            packageCourseTypes: [...new Set(bookings.map(b => b.class_packages?.course_type).filter(Boolean))]
        });
    }
    const selectedBooking = bookings.find(b => b.booking_id === selectedBookingId);
    const handleBookingSelect = (booking) => {
        console.log('BOOKING SELECTOR DEBUG - Selected booking:', booking);
        console.log('BOOKING SELECTOR DEBUG - booking.booking_id:', booking.booking_id);
        console.log('BOOKING SELECTOR DEBUG - booking.id:', booking.id);
        // Only pass booking_id if it exists and is not empty, otherwise pass empty string
        const bookingIdToPass = booking.booking_id && booking.booking_id.trim() !== '' ? booking.booking_id : '';
        console.log('BOOKING SELECTOR DEBUG - Will pass:', bookingIdToPass);
        onBookingSelect(bookingIdToPass, `${booking.first_name} ${booking.last_name}`, booking.email);
        setIsOpen(false);
        setSearchTerm('');
    };
    const clearSelection = () => {
        onBookingSelect('', '', '');
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
    return (_jsxs("div", { className: "relative", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Link to Booking (Optional)" }), _jsxs("div", { className: "relative", children: [_jsxs("button", { type: "button", onClick: () => setIsOpen(!isOpen), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-left flex items-center justify-between", children: [_jsx("span", { className: "flex-1", children: selectedBooking ? (_jsxs("div", { className: "flex items-center", children: [_jsx(User, { className: "w-4 h-4 mr-2 text-gray-400" }), _jsxs("span", { className: "font-medium", children: [selectedBooking.first_name, " ", selectedBooking.last_name] }), _jsxs("span", { className: "ml-2 text-sm text-gray-500", children: ["(", selectedBooking.email, ")"] }), _jsx("span", { className: `ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(selectedBooking.status)}`, children: selectedBooking.status })] })) : (_jsx("span", { className: "text-gray-500", children: "Select a booking..." })) }), _jsx(ChevronDown, { className: `w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}` })] }), isOpen && (_jsxs("div", { className: "absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-hidden", children: [_jsx("div", { className: "p-3 border-b border-gray-200", children: _jsx("input", { type: "text", placeholder: "Search bookings...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500", autoFocus: true }) }), _jsx("div", { className: "border-b border-gray-200", children: _jsx("button", { type: "button", onClick: clearSelection, className: "w-full px-3 py-2 text-left hover:bg-gray-50 text-sm text-gray-600", children: _jsx("span", { className: "italic", children: "No booking (manual entry)" }) }) }), _jsx("div", { className: "max-h-60 overflow-y-auto", children: filteredBookings.length === 0 ? (_jsxs("div", { className: "p-3 text-sm text-gray-500", children: [_jsx("div", { className: "text-center mb-2", children: searchTerm ? 'No bookings match your search' :
                                                assignmentType === 'weekly' ?
                                                    'No public group bookings available. Weekly classes require bookings with booking_type = "public_group" or confirmed bookings without a booking type.' :
                                                    assignmentType === 'crash_course' ?
                                                        'No corporate crash course bookings available. Crash courses require bookings with booking_type = "corporate" and linked to crash course packages (course_type = "crash").' :
                                                        'No available bookings' }), (assignmentType === 'weekly' || assignmentType === 'crash_course') && bookings.length > 0 && (_jsxs("div", { className: "text-xs text-gray-400 border-t pt-2", children: [_jsx("div", { children: "Debug info:" }), _jsxs("div", { children: ["Total bookings: ", bookings.length] }), _jsxs("div", { children: ["Booking types: ", [...new Set(bookings.map(b => b.booking_type || 'null'))].join(', ')] }), _jsxs("div", { children: ["Statuses: ", [...new Set(bookings.map(b => b.status))].join(', ')] }), assignmentType === 'crash_course' && (_jsxs(_Fragment, { children: [_jsxs("div", { children: ["Package course types: ", [...new Set(bookings.map(b => b.class_packages?.course_type || 'null'))].join(', ')] }), _jsxs("div", { children: ["Bookings with package ID: ", bookings.filter(b => b.class_package_id).length] })] }))] }))] })) : (filteredBookings.map((booking) => (_jsx("button", { type: "button", onClick: () => handleBookingSelect(booking), className: `w-full px-3 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${selectedBookingId === (booking.booking_id || booking.id) ? 'bg-blue-50' : ''}`, children: _jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(User, { className: "w-4 h-4 mr-2 text-gray-400" }), _jsxs("span", { className: "font-medium text-gray-900", children: [booking.first_name, " ", booking.last_name] })] }), _jsx("span", { className: `px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`, children: booking.status })] }), _jsxs("div", { className: "flex items-center text-sm text-gray-600", children: [_jsx(Mail, { className: "w-3 h-3 mr-1" }), _jsx("span", { className: "mr-3", children: booking.email }), booking.phone && (_jsxs(_Fragment, { children: [_jsx(Phone, { className: "w-3 h-3 mr-1" }), _jsx("span", { children: booking.phone })] }))] }), _jsxs("div", { className: "text-sm text-gray-600", children: [_jsx("span", { className: "font-medium", children: "Class:" }), " ", booking.class_name || 'Unknown'] }), (booking.preferred_days?.length || booking.preferred_times?.length || booking.class_date || booking.class_time) && (_jsx("div", { className: "text-sm text-gray-600", children: booking.preferred_days?.length && booking.preferred_times?.length ? (_jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(Calendar, { className: "w-3 h-3 mr-1" }), _jsx("span", { className: "font-medium", children: "Preferred Days:" })] }), _jsxs("div", { className: "ml-4 space-y-0.5", children: [booking.preferred_days.slice(0, 2).map((day, index) => (_jsxs("div", { className: "flex items-center", children: [_jsx("span", { className: "mr-2", children: day }), booking.preferred_times?.[index] && (_jsxs(_Fragment, { children: [_jsx(Clock, { className: "w-3 h-3 mr-1" }), _jsx("span", { children: formatTime(booking.preferred_times[index]) })] })), booking.timezone && (_jsxs("span", { className: "ml-1 text-xs text-gray-500", children: ["(", booking.timezone, ")"] }))] }, index))), booking.preferred_days.length > 2 && (_jsxs("div", { className: "text-xs text-gray-500", children: ["+", booking.preferred_days.length - 2, " more..."] }))] })] })) : (
                                                /* Fallback to single date/time for backward compatibility */
                                                _jsxs("div", { className: "flex items-center", children: [_jsx(Calendar, { className: "w-3 h-3 mr-1" }), _jsx("span", { className: "mr-2", children: formatDate(booking.class_date) }), booking.class_time && (_jsxs(_Fragment, { children: [_jsx(Clock, { className: "w-3 h-3 mr-1" }), _jsx("span", { children: formatTime(booking.class_time) })] }))] })) }))] }) }, booking.id)))) })] }))] }), selectedBooking && (_jsx("div", { className: "mt-2 p-3 bg-blue-50 rounded-md border border-blue-200", children: _jsxs("div", { className: "text-sm", children: [_jsx("div", { className: "font-medium text-blue-900 mb-1", children: "Linked Booking Details:" }), _jsxs("div", { className: "text-blue-800", children: [_jsxs("div", { children: [_jsx("strong", { children: "Client:" }), " ", selectedBooking.first_name, " ", selectedBooking.last_name] }), _jsxs("div", { children: [_jsx("strong", { children: "Email:" }), " ", selectedBooking.email] }), selectedBooking.phone && (_jsxs("div", { children: [_jsx("strong", { children: "Phone:" }), " ", selectedBooking.phone] })), _jsxs("div", { children: [_jsx("strong", { children: "Class:" }), " ", selectedBooking.class_name || 'Unknown'] }), selectedBooking.preferred_days?.length && selectedBooking.preferred_times?.length ? (_jsxs("div", { className: "mt-2", children: [_jsx("div", { children: _jsx("strong", { children: "Preferred Days & Times:" }) }), _jsx("div", { className: "ml-4 space-y-1 mt-1", children: selectedBooking.preferred_days.map((day, index) => (_jsxs("div", { className: "flex items-center text-sm", children: [_jsx(Calendar, { className: "w-3 h-3 mr-1" }), _jsx("span", { className: "mr-2", children: day }), selectedBooking.preferred_times?.[index] && (_jsxs(_Fragment, { children: [_jsx(Clock, { className: "w-3 h-3 mr-1" }), _jsx("span", { children: formatTime(selectedBooking.preferred_times[index]) })] })), selectedBooking.timezone && (_jsxs("span", { className: "ml-1 text-xs text-blue-500", children: ["(", selectedBooking.timezone, ")"] }))] }, index))) })] })) : (
                                /* Fallback to single date/time for backward compatibility */
                                _jsxs(_Fragment, { children: [selectedBooking.class_date && (_jsxs("div", { children: [_jsx("strong", { children: "Date:" }), " ", formatDate(selectedBooking.class_date)] })), selectedBooking.class_time && (_jsxs("div", { children: [_jsx("strong", { children: "Time:" }), " ", formatTime(selectedBooking.class_time)] }))] })), _jsxs("div", { children: [_jsx("strong", { children: "Status:" }), _jsx("span", { className: `ml-1 px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(selectedBooking.status)}`, children: selectedBooking.status })] })] })] }) }))] }));
};
