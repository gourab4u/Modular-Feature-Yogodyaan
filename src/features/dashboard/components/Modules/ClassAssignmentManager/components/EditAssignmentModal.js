import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { X, Users, Save, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { MultipleBookingSelector } from './MultipleBookingSelector';
export const EditAssignmentModal = ({ assignment, isVisible, bookings, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        class_status: '',
        payment_amount: 0,
        payment_status: '',
        notes: '',
        booking_ids: []
    });
    const [saving, setSaving] = useState(false);
    const [studentCount, setStudentCount] = useState(1);
    useEffect(() => {
        if (assignment) {
            // Convert single booking_id to array for backwards compatibility
            const bookingIds = assignment.booking_id ? [assignment.booking_id] : [];
            setFormData({
                class_status: assignment.class_status || 'scheduled',
                payment_amount: assignment.payment_amount || 0,
                payment_status: assignment.payment_status || 'pending',
                notes: assignment.notes || '',
                booking_ids: bookingIds
            });
            // Calculate current student count based on selected bookings
            setStudentCount(bookingIds.length > 0 ? bookingIds.length : 1);
        }
    }, [assignment, bookings]);
    if (!isVisible || !assignment)
        return null;
    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };
    const handleBookingSelectionChange = (bookingIds) => {
        setFormData(prev => ({
            ...prev,
            booking_ids: bookingIds
        }));
        // Update student count based on booking selections (each booking = 1 student)
        setStudentCount(bookingIds.length > 0 ? bookingIds.length : 1);
    };
    const handleSave = async () => {
        if (!assignment)
            return;
        try {
            setSaving(true);
            // For now, we'll save the first booking ID to maintain compatibility with the current database schema
            // In the future, this should be updated to support multiple booking IDs in the database
            const primaryBookingId = formData.booking_ids.length > 0 ? formData.booking_ids[0] : null;
            const updates = {
                class_status: formData.class_status,
                payment_amount: formData.payment_amount,
                payment_status: formData.payment_status,
                notes: formData.notes || undefined,
                booking_id: primaryBookingId
            };
            await onSave(assignment.id, updates);
            onClose();
        }
        catch (error) {
            console.error('Error saving assignment:', error);
            const errorMessage = error.message || 'Failed to save changes. Please try again.';
            alert(errorMessage);
        }
        finally {
            setSaving(false);
        }
    };
    const canCancel = formData.class_status !== 'cancelled';
    const canReactivate = formData.class_status === 'cancelled';
    return (_jsxs("div", { className: "fixed inset-0 z-50 overflow-y-auto", children: [_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 transition-opacity", onClick: onClose }), _jsx("div", { className: "flex min-h-full items-center justify-center p-4", children: _jsxs("div", { className: "relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto", children: [_jsxs("div", { className: "flex items-center justify-between p-6 border-b border-gray-200", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900", children: "Edit Assignment" }), _jsx("button", { onClick: onClose, className: "text-gray-400 hover:text-gray-600 transition-colors", children: _jsx(X, { className: "w-6 h-6" }) })] }), _jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "mb-6 p-4 bg-gray-50 rounded-lg", children: [_jsx("h3", { className: "text-sm font-medium text-gray-500 mb-2", children: "Assignment Overview" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 text-sm", children: [_jsxs("div", { children: [_jsx("p", { className: "text-gray-600", children: "Class Type:" }), _jsx("p", { className: "font-medium", children: assignment.class_type?.name || 'N/A' })] }), _jsxs("div", { children: [_jsx("p", { className: "text-gray-600", children: "Date & Time:" }), _jsxs("p", { className: "font-medium", children: [assignment.date, " at ", assignment.start_time] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-gray-600", children: "Instructor:" }), _jsx("p", { className: "font-medium", children: assignment.instructor_profile?.full_name || 'N/A' })] })] })] }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Class Status" }), _jsxs("select", { value: formData.class_status, onChange: (e) => handleInputChange('class_status', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "scheduled", children: "Scheduled" }), _jsx("option", { value: "completed", children: "Completed" }), _jsx("option", { value: "cancelled", children: "Cancelled" })] }), formData.class_status === 'cancelled' && (_jsx("div", { className: "mt-2 p-3 bg-red-50 border border-red-200 rounded-md", children: _jsxs("div", { className: "flex items-center", children: [_jsx(AlertTriangle, { className: "w-4 h-4 text-red-500 mr-2" }), _jsxs("p", { className: "text-sm text-red-700", children: ["This class will be marked as cancelled.", formData.booking_ids.length > 0 && ` Notification emails will be sent to ${formData.booking_ids.length} linked booking${formData.booking_ids.length !== 1 ? 's' : ''}.`] })] }) }))] }), _jsxs("div", { children: [_jsx(MultipleBookingSelector, { bookings: bookings, selectedBookingIds: formData.booking_ids, onBookingSelectionChange: handleBookingSelectionChange, assignmentType: "adhoc" }), _jsx("div", { className: "mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md", children: _jsxs("div", { className: "flex items-center", children: [_jsx(Users, { className: "w-4 h-4 text-blue-500 mr-2" }), _jsxs("p", { className: "text-sm text-blue-700", children: ["Students: ", _jsx("span", { className: "font-medium", children: studentCount }), formData.booking_ids.length > 0 ? ` (from ${formData.booking_ids.length} selected booking${formData.booking_ids.length !== 1 ? 's' : ''})` : ' (manual entry)'] })] }) })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Payment Amount (\u20B9)" }), _jsx("input", { type: "number", step: "0.01", min: "0", value: formData.payment_amount, onChange: (e) => handleInputChange('payment_amount', parseFloat(e.target.value) || 0), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Payment Status" }), _jsxs("select", { value: formData.payment_status, onChange: (e) => handleInputChange('payment_status', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "pending", children: "Pending" }), _jsx("option", { value: "paid", children: "Paid" }), _jsx("option", { value: "cancelled", children: "Cancelled" })] })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Notes" }), _jsx("textarea", { value: formData.notes, onChange: (e) => handleInputChange('notes', e.target.value), rows: 3, className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", placeholder: "Add any additional notes..." })] }), _jsxs("div", { className: "p-4 bg-green-50 rounded-lg border border-green-200", children: [_jsx("h4", { className: "text-sm font-medium text-green-800 mb-2", children: "Payment Summary" }), _jsxs("div", { className: "grid grid-cols-2 gap-4 text-sm", children: [_jsxs("div", { children: [_jsx("span", { className: "text-green-600", children: "Total Amount:" }), _jsxs("span", { className: "ml-2 font-medium", children: ["\u20B9", formData.payment_amount.toFixed(2)] })] }), _jsxs("div", { children: [_jsx("span", { className: "text-green-600", children: "Students:" }), _jsx("span", { className: "ml-2 font-medium", children: studentCount })] })] })] })] })] }), _jsxs("div", { className: "flex justify-between items-center px-6 py-4 border-t border-gray-200", children: [_jsxs("div", { className: "flex space-x-2", children: [canCancel && formData.class_status !== 'cancelled' && (_jsx("button", { onClick: () => handleInputChange('class_status', 'cancelled'), className: "px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500", children: "Cancel Class" })), canReactivate && formData.class_status === 'cancelled' && (_jsx("button", { onClick: () => handleInputChange('class_status', 'scheduled'), className: "px-4 py-2 text-sm font-medium text-green-700 bg-green-100 border border-green-300 rounded-md hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500", children: "Reactivate Class" }))] }), _jsxs("div", { className: "flex space-x-3", children: [_jsx("button", { onClick: onClose, className: "px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500", children: "Cancel" }), _jsx("button", { onClick: handleSave, disabled: saving, className: "px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center", children: saving ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" }), "Saving..."] })) : (_jsxs(_Fragment, { children: [_jsx(Save, { className: "w-4 h-4 mr-2" }), "Save Changes"] })) })] })] })] }) })] }));
};
