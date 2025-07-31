import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { ChevronDown, User, Calendar, Clock, Phone, Mail } from 'lucide-react';
import { useState } from 'react';
export const BookingSelector = ({ bookings, selectedBookingId, onBookingSelect, classTypeId }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    // Filter bookings by class type if specified, and by search term
    const filteredBookings = bookings.filter(booking => {
        const matchesClassType = !classTypeId || booking.class_type_id === classTypeId;
        const matchesSearch = !searchTerm ||
            booking.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            booking.client_email.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesClassType && matchesSearch;
    });
    const selectedBooking = bookings.find(b => b.id === selectedBookingId);
    const handleBookingSelect = (booking) => {
        onBookingSelect(booking.id, booking.client_name, booking.client_email);
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
    return (_jsxs("div", { className: "relative", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Link to Booking (Optional)" }), _jsxs("div", { className: "relative", children: [_jsxs("button", { type: "button", onClick: () => setIsOpen(!isOpen), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-left flex items-center justify-between", children: [_jsx("span", { className: "flex-1", children: selectedBooking ? (_jsxs("div", { className: "flex items-center", children: [_jsx(User, { className: "w-4 h-4 mr-2 text-gray-400" }), _jsx("span", { className: "font-medium", children: selectedBooking.client_name }), _jsxs("span", { className: "ml-2 text-sm text-gray-500", children: ["(", selectedBooking.client_email, ")"] }), _jsx("span", { className: `ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(selectedBooking.status)}`, children: selectedBooking.status })] })) : (_jsx("span", { className: "text-gray-500", children: "Select a booking..." })) }), _jsx(ChevronDown, { className: `w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}` })] }), isOpen && (_jsxs("div", { className: "absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-hidden", children: [_jsx("div", { className: "p-3 border-b border-gray-200", children: _jsx("input", { type: "text", placeholder: "Search bookings...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500", autoFocus: true }) }), _jsx("div", { className: "border-b border-gray-200", children: _jsx("button", { type: "button", onClick: clearSelection, className: "w-full px-3 py-2 text-left hover:bg-gray-50 text-sm text-gray-600", children: _jsx("span", { className: "italic", children: "No booking (manual entry)" }) }) }), _jsx("div", { className: "max-h-60 overflow-y-auto", children: filteredBookings.length === 0 ? (_jsx("div", { className: "p-3 text-sm text-gray-500 text-center", children: searchTerm ? 'No bookings match your search' : 'No available bookings' })) : (filteredBookings.map((booking) => (_jsx("button", { type: "button", onClick: () => handleBookingSelect(booking), className: `w-full px-3 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${selectedBookingId === booking.id ? 'bg-blue-50' : ''}`, children: _jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(User, { className: "w-4 h-4 mr-2 text-gray-400" }), _jsx("span", { className: "font-medium text-gray-900", children: booking.client_name })] }), _jsx("span", { className: `px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`, children: booking.status })] }), _jsxs("div", { className: "flex items-center text-sm text-gray-600", children: [_jsx(Mail, { className: "w-3 h-3 mr-1" }), _jsx("span", { className: "mr-3", children: booking.client_email }), booking.client_phone && (_jsxs(_Fragment, { children: [_jsx(Phone, { className: "w-3 h-3 mr-1" }), _jsx("span", { children: booking.client_phone })] }))] }), _jsxs("div", { className: "text-sm text-gray-600", children: [_jsx("span", { className: "font-medium", children: "Class:" }), " ", booking.class_type?.name || 'Unknown'] }), (booking.preferred_date || booking.preferred_time) && (_jsxs("div", { className: "flex items-center text-sm text-gray-600", children: [_jsx(Calendar, { className: "w-3 h-3 mr-1" }), _jsx("span", { className: "mr-2", children: formatDate(booking.preferred_date) }), booking.preferred_time && (_jsxs(_Fragment, { children: [_jsx(Clock, { className: "w-3 h-3 mr-1" }), _jsx("span", { children: formatTime(booking.preferred_time) })] }))] })), booking.notes && (_jsx("div", { className: "text-xs text-gray-500 italic truncate", children: booking.notes }))] }) }, booking.id)))) })] }))] }), selectedBooking && (_jsx("div", { className: "mt-2 p-3 bg-blue-50 rounded-md border border-blue-200", children: _jsxs("div", { className: "text-sm", children: [_jsx("div", { className: "font-medium text-blue-900 mb-1", children: "Linked Booking Details:" }), _jsxs("div", { className: "text-blue-800", children: [_jsxs("div", { children: [_jsx("strong", { children: "Client:" }), " ", selectedBooking.client_name] }), _jsxs("div", { children: [_jsx("strong", { children: "Email:" }), " ", selectedBooking.client_email] }), selectedBooking.client_phone && (_jsxs("div", { children: [_jsx("strong", { children: "Phone:" }), " ", selectedBooking.client_phone] })), _jsxs("div", { children: [_jsx("strong", { children: "Class Type:" }), " ", selectedBooking.class_type?.name || 'Unknown'] }), selectedBooking.preferred_date && (_jsxs("div", { children: [_jsx("strong", { children: "Preferred Date:" }), " ", formatDate(selectedBooking.preferred_date)] })), selectedBooking.preferred_time && (_jsxs("div", { children: [_jsx("strong", { children: "Preferred Time:" }), " ", formatTime(selectedBooking.preferred_time)] })), _jsxs("div", { children: [_jsx("strong", { children: "Status:" }), _jsx("span", { className: `ml-1 px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(selectedBooking.status)}`, children: selectedBooking.status })] })] })] }) }))] }));
};
