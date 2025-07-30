import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Search, Eye, User, Calendar, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from './Button';
import { supabase } from '../../lib/supabase';
export function BookingSelector({ selectedBookingId, onBookingSelect, disabled = false }) {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [showBookingDetails, setShowBookingDetails] = useState(false);
    const [bookingDetails, setBookingDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    useEffect(() => {
        fetchBookings();
    }, []);
    useEffect(() => {
        if (selectedBookingId) {
            const booking = bookings.find(b => b.booking_id === selectedBookingId);
            if (booking) {
                setSelectedBooking(booking);
            }
        }
    }, [selectedBookingId, bookings]);
    const fetchBookings = async () => {
        try {
            setLoading(true);
            // Fetch bookings that don't have assignments yet or need new assignments
            const { data, error } = await supabase
                .from('bookings')
                .select('*')
                .in('status', ['confirmed', 'pending', 'rescheduled'])
                .order('created_at', { ascending: false })
                .limit(100);
            if (error)
                throw error;
            setBookings(data || []);
        }
        catch (error) {
            console.error('Error fetching bookings:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const fetchBookingDetails = async (bookingId) => {
        try {
            setLoadingDetails(true);
            // Call the PostgreSQL function to get booking details
            const { data, error } = await supabase
                .rpc('get_booking_details', { booking_id_param: bookingId });
            if (error)
                throw error;
            if (data && data.length > 0) {
                setBookingDetails(data[0]);
            }
        }
        catch (error) {
            console.error('Error fetching booking details:', error);
        }
        finally {
            setLoadingDetails(false);
        }
    };
    const handleBookingSelect = (booking) => {
        setSelectedBooking(booking);
        const clientName = `${booking.first_name} ${booking.last_name}`;
        onBookingSelect(booking.booking_id, clientName, booking.email);
        setShowDropdown(false);
    };
    const handleViewDetails = async (bookingId) => {
        setShowBookingDetails(true);
        await fetchBookingDetails(bookingId);
    };
    const filteredBookings = bookings.filter(booking => {
        const searchLower = searchTerm.toLowerCase();
        const clientName = `${booking.first_name} ${booking.last_name}`.toLowerCase();
        return (booking.booking_id.toLowerCase().includes(searchLower) ||
            clientName.includes(searchLower) ||
            booking.email.toLowerCase().includes(searchLower) ||
            booking.class_name.toLowerCase().includes(searchLower));
    });
    return (_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Booking Reference (Optional)" }), _jsxs("div", { className: "relative", children: [_jsxs("div", { className: `
            w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 
            cursor-pointer transition-colors flex items-center justify-between
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400 dark:hover:border-gray-500'}
            ${showDropdown ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-20' : ''}
          `, onClick: () => !disabled && setShowDropdown(!showDropdown), children: [_jsxs("div", { className: "flex items-center space-x-2 flex-1", children: [_jsx(User, { className: "w-4 h-4 text-gray-400" }), selectedBooking ? (_jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "font-medium text-gray-900 dark:text-gray-100", children: selectedBooking.booking_id }), _jsxs("div", { className: "text-sm text-gray-500 dark:text-gray-400", children: [selectedBooking.first_name, " ", selectedBooking.last_name, " \u2022 ", selectedBooking.email] })] })) : (_jsx("span", { className: "text-gray-500 dark:text-gray-400", children: "Select existing booking or leave empty for new client" }))] }), selectedBooking && (_jsx("div", { className: "flex items-center space-x-2", children: _jsx(Button, { variant: "outline", size: "sm", onClick: (e) => {
                                        e.stopPropagation();
                                        handleViewDetails(selectedBooking.booking_id);
                                    }, className: "p-1", children: _jsx(Eye, { className: "w-3 h-3" }) }) }))] }), showDropdown && (_jsxs("div", { className: "absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-64 overflow-hidden", children: [_jsx("div", { className: "p-3 border-b border-gray-200 dark:border-gray-700", children: _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-2.5 w-4 h-4 text-gray-400" }), _jsx("input", { type: "text", placeholder: "Search by Booking ID, name, email...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" })] }) }), _jsx("div", { className: "max-h-48 overflow-y-auto", children: loading ? (_jsx("div", { className: "p-4 text-center text-gray-500", children: "Loading bookings..." })) : filteredBookings.length === 0 ? (_jsx("div", { className: "p-4 text-center text-gray-500", children: "No bookings found" })) : (_jsxs("div", { className: "divide-y divide-gray-200 dark:divide-gray-700", children: [_jsx("div", { className: "p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer", onClick: () => {
                                                setSelectedBooking(null);
                                                onBookingSelect('', '', '');
                                                setShowDropdown(false);
                                            }, children: _jsx("div", { className: "text-sm text-gray-600 dark:text-gray-400 italic", children: "Clear selection (new client)" }) }), filteredBookings.map((booking) => (_jsx("div", { className: "p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer", onClick: () => handleBookingSelect(booking), children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("span", { className: "font-medium text-blue-600 dark:text-blue-400 text-sm", children: booking.booking_id }), _jsx("span", { className: `
                              px-2 py-0.5 rounded-full text-xs font-medium
                              ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                                                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                                                'bg-gray-100 text-gray-800'}
                            `, children: booking.status })] }), _jsxs("div", { className: "text-sm font-medium text-gray-900 dark:text-gray-100 mt-1", children: [booking.first_name, " ", booking.last_name] }), _jsxs("div", { className: "text-xs text-gray-500 dark:text-gray-400", children: [booking.email, " \u2022 ", booking.phone] }), _jsxs("div", { className: "flex items-center space-x-4 mt-1 text-xs text-gray-600 dark:text-gray-400", children: [_jsxs("span", { className: "flex items-center space-x-1", children: [_jsx(Calendar, { className: "w-3 h-3" }), _jsx("span", { children: booking.class_date })] }), _jsxs("span", { className: "flex items-center space-x-1", children: [_jsx(Clock, { className: "w-3 h-3" }), _jsx("span", { children: booking.class_time })] })] })] }), _jsx(Button, { variant: "outline", size: "sm", onClick: (e) => {
                                                            e.stopPropagation();
                                                            handleViewDetails(booking.booking_id);
                                                        }, className: "p-1 ml-2", children: _jsx(Eye, { className: "w-3 h-3" }) })] }) }, booking.booking_id)))] })) })] }))] }), showBookingDetails && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4", children: _jsx("div", { className: "bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto", children: _jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-gray-100", children: "Booking Details" }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => setShowBookingDetails(false), children: "\u2715" })] }), loadingDetails ? (_jsx("div", { className: "flex items-center justify-center py-8", children: _jsx("div", { className: "text-gray-500", children: "Loading booking details..." }) })) : bookingDetails ? (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Booking ID" }), _jsx("div", { className: "mt-1 text-sm text-gray-900 dark:text-gray-100 font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded", children: bookingDetails.booking_id })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Status" }), _jsx("div", { className: `mt-1 inline-flex px-2 py-1 rounded-full text-xs font-medium ${bookingDetails.booking_status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                                            bookingDetails.booking_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-gray-100 text-gray-800'}`, children: bookingDetails.booking_status })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Client Name" }), _jsx("div", { className: "mt-1 text-sm text-gray-900 dark:text-gray-100", children: bookingDetails.client_name })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Email" }), _jsx("div", { className: "mt-1 text-sm text-gray-900 dark:text-gray-100", children: bookingDetails.client_email })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Phone" }), _jsx("div", { className: "mt-1 text-sm text-gray-900 dark:text-gray-100", children: bookingDetails.client_phone })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Experience Level" }), _jsx("div", { className: "mt-1 text-sm text-gray-900 dark:text-gray-100", children: bookingDetails.experience_level })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Requested Class" }), _jsx("div", { className: "mt-1 text-sm text-gray-900 dark:text-gray-100", children: bookingDetails.requested_class })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Requested Date" }), _jsx("div", { className: "mt-1 text-sm text-gray-900 dark:text-gray-100", children: bookingDetails.requested_date })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Requested Time" }), _jsx("div", { className: "mt-1 text-sm text-gray-900 dark:text-gray-100", children: bookingDetails.requested_time })] })] }), bookingDetails.special_requests && (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Special Requests" }), _jsx("div", { className: "mt-1 text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-3 rounded", children: bookingDetails.special_requests })] })), bookingDetails.has_assignment && (_jsxs("div", { className: "border-t pt-4", children: [_jsx("h4", { className: "font-medium text-gray-900 dark:text-gray-100 mb-3", children: "Current Assignment" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Assigned Date" }), _jsx("div", { className: "mt-1 text-sm text-gray-900 dark:text-gray-100", children: bookingDetails.assignment_date })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Assigned Time" }), _jsx("div", { className: "mt-1 text-sm text-gray-900 dark:text-gray-100", children: bookingDetails.assignment_time })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Assigned Instructor" }), _jsx("div", { className: "mt-1 text-sm text-gray-900 dark:text-gray-100", children: bookingDetails.assigned_instructor })] })] }))] })) : (_jsx("div", { className: "text-center py-4 text-gray-500", children: "No booking details found" }))] }) }) })), selectedBooking && (_jsxs("div", { className: "text-xs text-gray-500 dark:text-gray-400", children: ["Selected booking: ", selectedBooking.class_name, " for ", selectedBooking.first_name, " ", selectedBooking.last_name, " on ", selectedBooking.class_date] }))] }));
}
