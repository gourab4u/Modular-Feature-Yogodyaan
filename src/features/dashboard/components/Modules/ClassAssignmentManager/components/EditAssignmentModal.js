import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { AlertTriangle, Save, Users, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../../../../../../shared/lib/supabase';
import { AssignmentCreationService } from '../services/assignmentCreation';
import { MultipleBookingSelector } from './MultipleBookingSelector';
export const EditAssignmentModal = ({ assignment, isVisible, bookings, onClose, onSave, onRefresh }) => {
    const [formData, setFormData] = useState({
        class_status: '',
        payment_amount: 0,
        payment_status: '',
        notes: '',
        booking_ids: [],
        payment_type: 'per_class',
        total_classes: 1,
        weekly_days: [],
        monthly_assignment_method: 'weekly_recurrence',
        manual_selections: []
    });
    const [perStudentAmount, setPerStudentAmount] = useState(0);
    const [saving, setSaving] = useState(false);
    const [studentCount, setStudentCount] = useState(1);
    useEffect(() => {
        if (assignment) {
            // Get booking IDs from the new junction table structure
            let bookingIds = [];
            if (assignment.assignment_bookings && assignment.assignment_bookings.length > 0) {
                bookingIds = assignment.assignment_bookings.map(ab => ab.booking_id);
            }
            setFormData({
                class_status: assignment.class_status || 'scheduled',
                payment_amount: assignment.payment_amount || 0,
                payment_status: assignment.payment_status || 'pending',
                notes: assignment.notes || '',
                booking_ids: bookingIds,
                payment_type: assignment.payment_type || 'per_class',
                total_classes: assignment.total_classes || 1,
                weekly_days: assignment.weekly_days || [],
                monthly_assignment_method: assignment.monthly_assignment_method || 'weekly_recurrence',
                manual_selections: assignment.manual_selections || []
            });
            // Set per-student amount based on initial total and number of bookings
            const n = bookingIds.length > 0 ? bookingIds.length : 1;
            setPerStudentAmount((assignment.payment_amount || 0) / n);
            // Calculate current student count based on selected bookings
            setStudentCount(bookingIds.length > 0 ? bookingIds.length : 1);
        }
    }, [assignment, bookings]);
    if (!isVisible || !assignment)
        return null;
    const handleInputChange = (field, value) => {
        if (field === 'payment_amount') {
            setPerStudentAmount(value);
        }
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };
    const handleBookingSelectionChange = (bookingIds) => {
        const newStudentCount = bookingIds.length > 0 ? bookingIds.length : 1;
        setStudentCount(newStudentCount);
        setFormData(prev => {
            // Recalculate payment amount using updated booking IDs and student count
            const updatedFormData = {
                ...prev,
                booking_ids: bookingIds
            };
            // Build minimal FormData for calculation
            const paymentType = updatedFormData.payment_type || 'per_class';
            const totalClasses = updatedFormData.total_classes || 1;
            const minimalFormData = {
                payment_type: paymentType,
                payment_amount: perStudentAmount,
                total_classes: totalClasses,
                assignment_type: assignment.schedule_type || 'adhoc',
                class_type_id: assignment.class_type_id || '',
                instructor_id: assignment.instructor_id || '',
                date: assignment.date || '',
                booking_ids: bookingIds,
            };
            // Calculate new payment amount
            const recalculatedAmount = AssignmentCreationService['calculatePaymentAmount'](minimalFormData, assignment.schedule_type || 'adhoc', totalClasses, newStudentCount);
            return {
                ...updatedFormData,
                payment_amount: recalculatedAmount
            };
        });
    };
    const handleSave = async () => {
        if (!assignment)
            return;
        try {
            setSaving(true);
            // If booking_type is individual and weekly_days are selected, distribute classes using AssignmentCreationService
            if (assignment.booking_type === 'individual' &&
                Array.isArray(formData.weekly_days) &&
                formData.weekly_days.length > 0) {
                // Prepare formData for monthly assignment creation
                const monthlyFormData = {
                    ...formData,
                    assignment_type: 'monthly',
                    booking_type: assignment.booking_type,
                    schedule_type: 'monthly',
                    start_date: assignment.date, // fallback, ideally should be editable
                    end_date: undefined, // can be set if needed
                    package_id: assignment.package_id || undefined,
                    class_type_id: assignment.class_type_id,
                    instructor_id: assignment.instructor_id,
                    start_time: assignment.start_time,
                    end_time: assignment.end_time,
                    notes: formData.notes,
                    payment_type: formData.payment_type,
                    payment_amount: formData.payment_amount,
                    total_classes: formData.total_classes,
                    weekly_days: formData.weekly_days,
                    booking_ids: formData.booking_ids,
                    // Add other fields as needed
                };
                // Distribute classes using weekly_days
                await AssignmentCreationService.createAssignment(monthlyFormData, [], formData.booking_ids.length);
                if (onRefresh) {
                    await onRefresh();
                }
                onClose();
                setSaving(false);
                return;
            }
            // Default: single assignment update
            // Recalculate payment amount before saving
            const paymentType = formData.payment_type || 'per_class';
            const totalClasses = formData.total_classes || 1;
            const newStudentCount = formData.booking_ids.length > 0 ? formData.booking_ids.length : 1;
            const minimalFormData = {
                payment_type: paymentType,
                payment_amount: paymentType === 'per_student_per_class' ? perStudentAmount : formData.payment_amount,
                total_classes: totalClasses,
                assignment_type: assignment.schedule_type || 'adhoc',
                class_type_id: assignment.class_type_id || '',
                instructor_id: assignment.instructor_id || '',
                date: assignment.date || '',
                booking_ids: formData.booking_ids,
            };
            const recalculatedAmount = AssignmentCreationService['calculatePaymentAmount'](minimalFormData, assignment.schedule_type || 'adhoc', totalClasses, newStudentCount);
            // 1. Save assignment updates
            const updates = {
                class_status: formData.class_status,
                payment_amount: recalculatedAmount,
                payment_status: formData.payment_status,
                notes: formData.notes || undefined
            };
            await onSave(assignment.id, updates);
            // 2. Update booking associations in junction table
            // First, delete existing associations
            const { error: deleteError } = await supabase
                .from('assignment_bookings')
                .delete()
                .eq('assignment_id', assignment.id);
            if (deleteError) {
                console.error('Failed to delete existing booking associations:', deleteError);
                throw new Error(`Failed to update booking associations: ${deleteError.message}`);
            }
            // Then, insert new associations if any bookings are selected
            if (formData.booking_ids.length > 0) {
                const associations = formData.booking_ids
                    .filter(bookingId => bookingId && bookingId.trim() !== '')
                    .map(bookingId => ({
                    assignment_id: assignment.id,
                    booking_id: bookingId.trim()
                }));
                if (associations.length > 0) {
                    const { error: insertError } = await supabase
                        .from('assignment_bookings')
                        .insert(associations);
                    if (insertError) {
                        console.error('Failed to create new booking associations:', insertError);
                        throw new Error(`Failed to link bookings to assignment: ${insertError.message}`);
                    }
                    console.log(`Successfully updated ${associations.length} booking association(s)`);
                }
            }
            // Refresh data to show updated booking associations
            if (onRefresh) {
                await onRefresh();
            }
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
    return (_jsxs("div", { className: "fixed inset-0 z-50 overflow-y-auto", children: [_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 transition-opacity", onClick: onClose }), _jsx("div", { className: "flex min-h-full items-center justify-center p-4", children: _jsxs("div", { className: "relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto", children: [_jsxs("div", { className: "flex items-center justify-between p-6 border-b border-gray-200", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900", children: "Edit Assignment" }), _jsx("button", { onClick: onClose, className: "text-gray-400 hover:text-gray-600 transition-colors", children: _jsx(X, { className: "w-6 h-6" }) })] }), _jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "mb-6 p-4 bg-gray-50 rounded-lg", children: [_jsx("h3", { className: "text-sm font-medium text-gray-500 mb-2", children: "Assignment Overview" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 text-sm", children: [_jsxs("div", { children: [_jsx("p", { className: "text-gray-600", children: "Class Type:" }), _jsx("p", { className: "font-medium", children: assignment.class_type?.name || 'N/A' })] }), _jsxs("div", { children: [_jsx("p", { className: "text-gray-600", children: "Date & Time:" }), _jsxs("p", { className: "font-medium", children: [assignment.date, " at ", assignment.start_time] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-gray-600", children: "Instructor:" }), _jsx("p", { className: "font-medium", children: assignment.instructor_profile?.full_name || 'N/A' })] })] })] }), assignment.assignment_bookings && assignment.assignment_bookings.some(ab => !bookings.find(b => b.booking_id === ab.booking_id)) && (_jsx("div", { className: "mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg", children: _jsxs("div", { className: "flex items-center", children: [_jsx(AlertTriangle, { className: "w-4 h-4 text-yellow-500 mr-2" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-yellow-800", children: "Invalid Booking Reference" }), _jsx("p", { className: "text-xs text-yellow-700 mt-1", children: "This assignment has booking references that no longer exist. Those bookings have been cleared from the selection." })] })] }) })), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Class Status" }), _jsxs("select", { value: formData.class_status, onChange: (e) => handleInputChange('class_status', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "scheduled", children: "Scheduled" }), _jsx("option", { value: "completed", children: "Completed" }), _jsx("option", { value: "cancelled", children: "Cancelled" })] }), formData.class_status === 'cancelled' && (_jsx("div", { className: "mt-2 p-3 bg-red-50 border border-red-200 rounded-md", children: _jsxs("div", { className: "flex items-center", children: [_jsx(AlertTriangle, { className: "w-4 h-4 text-red-500 mr-2" }), _jsxs("p", { className: "text-sm text-red-700", children: ["This class will be marked as cancelled.", formData.booking_ids.length > 0 && ` Notification emails will be sent to ${formData.booking_ids.length} linked booking${formData.booking_ids.length !== 1 ? 's' : ''}.`] })] }) }))] }), _jsxs("div", { children: [_jsx(MultipleBookingSelector, { bookings: bookings, selectedBookingIds: formData.booking_ids, onBookingSelectionChange: handleBookingSelectionChange, assignmentType: "adhoc" }), _jsx("div", { className: "mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md", children: _jsxs("div", { className: "flex items-center", children: [_jsx(Users, { className: "w-4 h-4 text-blue-500 mr-2" }), _jsxs("p", { className: "text-sm text-blue-700", children: ["Students: ", _jsx("span", { className: "font-medium", children: studentCount }), formData.booking_ids.length > 0 ? ` (from ${formData.booking_ids.length} selected booking${formData.booking_ids.length !== 1 ? 's' : ''})` : ' (manual entry)'] })] }) })] }), assignment.booking_type === 'individual' && assignment.schedule_type === 'monthly' && (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-3", children: "Package Assignment Method" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "border border-gray-200 rounded-lg p-4", children: [_jsxs("div", { className: "flex items-center", children: [_jsx("input", { type: "radio", id: "weekly-recurrence", name: "monthly_assignment_method", checked: formData.monthly_assignment_method === 'weekly_recurrence', onChange: () => setFormData(prev => ({
                                                                                ...prev,
                                                                                monthly_assignment_method: 'weekly_recurrence'
                                                                            })), className: "h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300" }), _jsx("label", { htmlFor: "weekly-recurrence", className: "ml-3 text-sm font-medium text-gray-700", children: "Weekly Recurrence" })] }), _jsx("p", { className: "ml-7 text-sm text-gray-500 mt-1", children: "Select days of the week and time, auto-generate until package classes are complete" }), formData.monthly_assignment_method === 'weekly_recurrence' && (_jsxs("div", { className: "ml-7 mt-3", children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: ["Select Days of Week ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("div", { className: "grid grid-cols-7 gap-2", children: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (_jsxs("label", { className: "flex items-center justify-center", children: [_jsx("input", { type: "checkbox", checked: formData.weekly_days.includes(index), onChange: (e) => {
                                                                                            const newDays = e.target.checked
                                                                                                ? [...formData.weekly_days, index]
                                                                                                : formData.weekly_days.filter(d => d !== index);
                                                                                            setFormData(prev => ({
                                                                                                ...prev,
                                                                                                weekly_days: newDays
                                                                                            }));
                                                                                        }, className: "sr-only" }), _jsx("div", { className: `w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium border ${formData.weekly_days.includes(index)
                                                                                            ? 'bg-blue-500 text-white border-blue-500'
                                                                                            : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'}`, children: day })] }, day))) }), formData.weekly_days.length === 0 && (_jsx("p", { className: "text-red-500 text-sm mt-1", children: "Please select at least one day." }))] }))] }), _jsxs("div", { className: "border border-gray-200 rounded-lg p-4", children: [_jsxs("div", { className: "flex items-center", children: [_jsx("input", { type: "radio", id: "manual-calendar", name: "monthly_assignment_method", checked: formData.monthly_assignment_method === 'manual_calendar', onChange: () => setFormData(prev => ({
                                                                                ...prev,
                                                                                monthly_assignment_method: 'manual_calendar'
                                                                            })), className: "h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300" }), _jsx("label", { htmlFor: "manual-calendar", className: "ml-3 text-sm font-medium text-gray-700", children: "Manual Calendar Selection" })] }), _jsx("p", { className: "ml-7 text-sm text-gray-500 mt-1", children: "Manually pick each class date and time from calendar" })] })] })] })), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Payment Amount (\u20B9)" }), _jsx("input", { type: "number", step: "0.01", min: "0", value: formData.payment_amount, onChange: (e) => handleInputChange('payment_amount', parseFloat(e.target.value) || 0), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Payment Status" }), _jsxs("select", { value: formData.payment_status, onChange: (e) => handleInputChange('payment_status', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "pending", children: "Pending" }), _jsx("option", { value: "paid", children: "Paid" }), _jsx("option", { value: "cancelled", children: "Cancelled" })] })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Notes" }), _jsx("textarea", { value: formData.notes, onChange: (e) => handleInputChange('notes', e.target.value), rows: 3, className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", placeholder: "Add any additional notes..." })] }), _jsxs("div", { className: "p-4 bg-green-50 rounded-lg border border-green-200", children: [_jsx("h4", { className: "text-sm font-medium text-green-800 mb-2", children: "Payment Summary" }), _jsxs("div", { className: "grid grid-cols-2 gap-4 text-sm", children: [_jsxs("div", { children: [_jsx("span", { className: "text-green-600", children: "Total Amount:" }), _jsxs("span", { className: "ml-2 font-medium", children: ["\u20B9", formData.payment_amount.toFixed(2)] })] }), _jsxs("div", { children: [_jsx("span", { className: "text-green-600", children: "Students:" }), _jsx("span", { className: "ml-2 font-medium", children: studentCount })] })] })] })] })] }), _jsxs("div", { className: "flex justify-between items-center px-6 py-4 border-t border-gray-200", children: [_jsxs("div", { className: "flex space-x-2", children: [canCancel && formData.class_status !== 'cancelled' && (_jsx("button", { onClick: () => handleInputChange('class_status', 'cancelled'), className: "px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500", children: "Cancel Class" })), canReactivate && formData.class_status === 'cancelled' && (_jsx("button", { onClick: () => handleInputChange('class_status', 'scheduled'), className: "px-4 py-2 text-sm font-medium text-green-700 bg-green-100 border border-green-300 rounded-md hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500", children: "Reactivate Class" }))] }), _jsxs("div", { className: "flex space-x-3", children: [_jsx("button", { onClick: onClose, className: "px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500", children: "Cancel" }), _jsx("button", { onClick: handleSave, disabled: saving, className: "px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center", children: saving ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" }), "Saving..."] })) : (_jsxs(_Fragment, { children: [_jsx(Save, { className: "w-4 h-4 mr-2" }), "Save Changes"] })) })] })] })] }) })] }));
};
