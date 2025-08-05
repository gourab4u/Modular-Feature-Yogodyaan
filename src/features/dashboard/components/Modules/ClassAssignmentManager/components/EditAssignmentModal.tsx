import { AlertTriangle, Save, Users, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '../../../../../../shared/lib/supabase'
import { AssignmentCreationService } from '../services/assignmentCreation'
import { Booking, ClassAssignment, UserProfile } from '../types'
import { MultipleBookingSelector } from './MultipleBookingSelector'

interface EditAssignmentModalProps {
    assignment: ClassAssignment | null
    isVisible: boolean
    bookings: Booking[]
    userProfiles: UserProfile[]
    onClose: () => void
    onSave: (assignmentId: string, updates: Partial<ClassAssignment>) => Promise<void>
    onRefresh?: () => Promise<void>
}

export const EditAssignmentModal = ({
    assignment,
    isVisible,
    bookings,
    onClose,
    onSave,
    onRefresh
}: EditAssignmentModalProps) => {
    const [formData, setFormData] = useState({
        class_status: '',
        payment_amount: 0,
        payment_status: '',
        notes: '',
        booking_ids: [] as string[],
        payment_type: 'per_class',
        total_classes: 1,
        weekly_days: [] as number[],
        monthly_assignment_method: 'weekly_recurrence',
        manual_selections: []
    })
    const [perStudentAmount, setPerStudentAmount] = useState(0)
    const [saving, setSaving] = useState(false)
    const [studentCount, setStudentCount] = useState(1)

    useEffect(() => {
        if (assignment) {
            // Get booking IDs from the new junction table structure
            let bookingIds: string[] = []
            if (assignment.assignment_bookings && assignment.assignment_bookings.length > 0) {
                bookingIds = assignment.assignment_bookings.map(ab => ab.booking_id)
            }

            setFormData({
                class_status: assignment.class_status || 'scheduled',
                payment_amount: assignment.payment_amount || 0,
                payment_status: assignment.payment_status || 'pending',
                notes: assignment.notes || '',
                booking_ids: bookingIds,
                payment_type: (assignment as any).payment_type || 'per_class',
                total_classes: (assignment as any).total_classes || 1,
                weekly_days: (assignment as any).weekly_days || [],
                monthly_assignment_method: (assignment as any).monthly_assignment_method || 'weekly_recurrence',
                manual_selections: (assignment as any).manual_selections || []
            })
            // Set per-student amount based on initial total and number of bookings
            const n = bookingIds.length > 0 ? bookingIds.length : 1
            setPerStudentAmount((assignment.payment_amount || 0) / n)

            // Calculate current student count based on selected bookings
            setStudentCount(bookingIds.length > 0 ? bookingIds.length : 1)
        }
    }, [assignment, bookings])

    if (!isVisible || !assignment) return null

    const handleInputChange = (field: string, value: any) => {
        if (field === 'payment_amount') {
            setPerStudentAmount(value)
        }
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const handleBookingSelectionChange = (bookingIds: string[]) => {
        const newStudentCount = bookingIds.length > 0 ? bookingIds.length : 1
        setStudentCount(newStudentCount)

        setFormData(prev => {
            // Recalculate payment amount using updated booking IDs and student count
            const updatedFormData = {
                ...prev,
                booking_ids: bookingIds
            }
            // Build minimal FormData for calculation
            const paymentType = updatedFormData.payment_type || 'per_class'
            const totalClasses = updatedFormData.total_classes || 1
            const minimalFormData = {
                payment_type: paymentType,
                payment_amount: perStudentAmount,
                total_classes: totalClasses,
                assignment_type: (assignment as any).schedule_type || 'adhoc',
                class_type_id: (assignment as any).class_type_id || '',
                instructor_id: (assignment as any).instructor_id || '',
                date: (assignment as any).date || '',
                booking_ids: bookingIds,
            }
            // Calculate new payment amount
            const recalculatedAmount = AssignmentCreationService['calculatePaymentAmount'](
                minimalFormData as any,
                (assignment as any).schedule_type || 'adhoc',
                totalClasses,
                newStudentCount
            )
            return {
                ...updatedFormData,
                payment_amount: recalculatedAmount
            }
        })
    }


    const handleSave = async () => {
        if (!assignment) return

        try {
            setSaving(true)

            // If booking_type is individual and weekly_days are selected, distribute classes using AssignmentCreationService
            if (
                assignment.booking_type === 'individual' &&
                Array.isArray(formData.weekly_days) &&
                formData.weekly_days.length > 0
            ) {
                // Prepare formData for monthly assignment creation
                const monthlyFormData: any = {
                    ...formData,
                    assignment_type: 'monthly',
                    booking_type: assignment.booking_type,
                    schedule_type: 'monthly',
                    start_date: assignment.date, // fallback, ideally should be editable
                    end_date: undefined, // can be set if needed
                    package_id: (assignment as any).package_id || undefined,
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
                }
                // Distribute classes using weekly_days
                await AssignmentCreationService.createAssignment(monthlyFormData, [], formData.booking_ids.length)
                if (onRefresh) {
                    await onRefresh()
                }
                onClose()
                setSaving(false)
                return
            }

            // Default: single assignment update
            // Recalculate payment amount before saving
            const paymentType = formData.payment_type || 'per_class'
            const totalClasses = formData.total_classes || 1
            const newStudentCount = formData.booking_ids.length > 0 ? formData.booking_ids.length : 1
            const minimalFormData = {
                payment_type: paymentType,
                payment_amount: paymentType === 'per_student_per_class' ? perStudentAmount : formData.payment_amount,
                total_classes: totalClasses,
                assignment_type: (assignment as any).schedule_type || 'adhoc',
                class_type_id: (assignment as any).class_type_id || '',
                instructor_id: (assignment as any).instructor_id || '',
                date: (assignment as any).date || '',
                booking_ids: formData.booking_ids,
            }
            const recalculatedAmount = AssignmentCreationService['calculatePaymentAmount'](
                minimalFormData as any,
                (assignment as any).schedule_type || 'adhoc',
                totalClasses,
                newStudentCount
            )

            // 1. Save assignment updates
            const updates: Partial<ClassAssignment> = {
                class_status: formData.class_status as any,
                payment_amount: recalculatedAmount,
                payment_status: formData.payment_status as any,
                notes: formData.notes || undefined
            }

            await onSave(assignment.id, updates)

            // 2. Update booking associations in junction table
            // First, delete existing associations
            const { error: deleteError } = await supabase
                .from('assignment_bookings')
                .delete()
                .eq('assignment_id', assignment.id)

            if (deleteError) {
                console.error('Failed to delete existing booking associations:', deleteError)
                throw new Error(`Failed to update booking associations: ${deleteError.message}`)
            }

            // Then, insert new associations if any bookings are selected
            if (formData.booking_ids.length > 0) {
                const associations = formData.booking_ids
                    .filter(bookingId => bookingId && bookingId.trim() !== '')
                    .map(bookingId => ({
                        assignment_id: assignment.id,
                        booking_id: bookingId.trim()
                    }))

                if (associations.length > 0) {
                    const { error: insertError } = await supabase
                        .from('assignment_bookings')
                        .insert(associations)

                    if (insertError) {
                        console.error('Failed to create new booking associations:', insertError)
                        throw new Error(`Failed to link bookings to assignment: ${insertError.message}`)
                    }

                    console.log(`Successfully updated ${associations.length} booking association(s)`)
                }
            }

            // Refresh data to show updated booking associations
            if (onRefresh) {
                await onRefresh()
            }

            onClose()
        } catch (error) {
            console.error('Error saving assignment:', error)
            const errorMessage = error.message || 'Failed to save changes. Please try again.'
            alert(errorMessage)
        } finally {
            setSaving(false)
        }
    }

    const canCancel = formData.class_status !== 'cancelled'
    const canReactivate = formData.class_status === 'cancelled'

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Background overlay */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900">Edit Assignment</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {/* Assignment Overview */}
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                            <h3 className="text-sm font-medium text-gray-500 mb-2">Assignment Overview</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-600">Class Type:</p>
                                    <p className="font-medium">{assignment.class_type?.name || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Date & Time:</p>
                                    <p className="font-medium">{assignment.date} at {assignment.start_time}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Instructor:</p>
                                    <p className="font-medium">{assignment.instructor_profile?.full_name || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Invalid Booking Warning - Check if any assignment bookings reference non-existent bookings */}
                        {assignment.assignment_bookings && assignment.assignment_bookings.some(ab => !bookings.find(b => b.booking_id === ab.booking_id)) && (
                            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <div className="flex items-center">
                                    <AlertTriangle className="w-4 h-4 text-yellow-500 mr-2" />
                                    <div>
                                        <p className="text-sm font-medium text-yellow-800">Invalid Booking Reference</p>
                                        <p className="text-xs text-yellow-700 mt-1">
                                            This assignment has booking references that no longer exist. Those bookings have been cleared from the selection.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Edit Form */}
                        <div className="space-y-6">
                            {/* Class Status */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Class Status
                                </label>
                                <select
                                    value={formData.class_status}
                                    onChange={(e) => handleInputChange('class_status', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="scheduled">Scheduled</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>

                                {formData.class_status === 'cancelled' && (
                                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                                        <div className="flex items-center">
                                            <AlertTriangle className="w-4 h-4 text-red-500 mr-2" />
                                            <p className="text-sm text-red-700">
                                                This class will be marked as cancelled.
                                                {formData.booking_ids.length > 0 && ` Notification emails will be sent to ${formData.booking_ids.length} linked booking${formData.booking_ids.length !== 1 ? 's' : ''}.`}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Booking Selection */}
                            <div>
                                <MultipleBookingSelector
                                    bookings={bookings}
                                    selectedBookingIds={formData.booking_ids}
                                    onBookingSelectionChange={handleBookingSelectionChange}
                                    assignmentType="adhoc"
                                />

                                {/* Student Count Display */}
                                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                    <div className="flex items-center">
                                        <Users className="w-4 h-4 text-blue-500 mr-2" />
                                        <p className="text-sm text-blue-700">
                                            Students: <span className="font-medium">{studentCount}</span>
                                            {formData.booking_ids.length > 0 ? ` (from ${formData.booking_ids.length} selected booking${formData.booking_ids.length !== 1 ? 's' : ''})` : ' (manual entry)'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Package Assignment Method for Monthly Package */}
                            {assignment.booking_type === 'individual' && assignment.schedule_type === 'monthly' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Package Assignment Method
                                    </label>
                                    <div className="space-y-4">
                                        <div className="border border-gray-200 rounded-lg p-4">
                                            <div className="flex items-center">
                                                <input
                                                    type="radio"
                                                    id="weekly-recurrence"
                                                    name="monthly_assignment_method"
                                                    checked={formData.monthly_assignment_method === 'weekly_recurrence'}
                                                    onChange={() => setFormData(prev => ({
                                                        ...prev,
                                                        monthly_assignment_method: 'weekly_recurrence'
                                                    }))}
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                                />
                                                <label htmlFor="weekly-recurrence" className="ml-3 text-sm font-medium text-gray-700">
                                                    Weekly Recurrence
                                                </label>
                                            </div>
                                            <p className="ml-7 text-sm text-gray-500 mt-1">
                                                Select days of the week and time, auto-generate until package classes are complete
                                            </p>
                                            {formData.monthly_assignment_method === 'weekly_recurrence' && (
                                                <div className="ml-7 mt-3">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Select Days of Week <span className="text-red-500">*</span>
                                                    </label>
                                                    <div className="grid grid-cols-7 gap-2">
                                                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                                                            <label key={day} className="flex items-center justify-center">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={formData.weekly_days.includes(index)}
                                                                    onChange={(e) => {
                                                                        const newDays = e.target.checked
                                                                            ? [...formData.weekly_days, index]
                                                                            : formData.weekly_days.filter(d => d !== index)
                                                                        setFormData(prev => ({
                                                                            ...prev,
                                                                            weekly_days: newDays
                                                                        }))
                                                                    }}
                                                                    className="sr-only"
                                                                />
                                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium border ${formData.weekly_days.includes(index)
                                                                    ? 'bg-blue-500 text-white border-blue-500'
                                                                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                                                                    }`}>
                                                                    {day}
                                                                </div>
                                                            </label>
                                                        ))}
                                                    </div>
                                                    {formData.weekly_days.length === 0 && (
                                                        <p className="text-red-500 text-sm mt-1">Please select at least one day.</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="border border-gray-200 rounded-lg p-4">
                                            <div className="flex items-center">
                                                <input
                                                    type="radio"
                                                    id="manual-calendar"
                                                    name="monthly_assignment_method"
                                                    checked={formData.monthly_assignment_method === 'manual_calendar'}
                                                    onChange={() => setFormData(prev => ({
                                                        ...prev,
                                                        monthly_assignment_method: 'manual_calendar'
                                                    }))}
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                                />
                                                <label htmlFor="manual-calendar" className="ml-3 text-sm font-medium text-gray-700">
                                                    Manual Calendar Selection
                                                </label>
                                            </div>
                                            <p className="ml-7 text-sm text-gray-500 mt-1">
                                                Manually pick each class date and time from calendar
                                            </p>
                                            {/* Manual calendar selection UI can be added here if needed */}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Payment Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Payment Amount (₹)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.payment_amount}
                                        onChange={(e) => handleInputChange('payment_amount', parseFloat(e.target.value) || 0)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Payment Status
                                    </label>
                                    <select
                                        value={formData.payment_status}
                                        onChange={(e) => handleInputChange('payment_status', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="paid">Paid</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                            </div>


                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Notes
                                </label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => handleInputChange('notes', e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Add any additional notes..."
                                />
                            </div>

                            {/* Payment Summary */}
                            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                <h4 className="text-sm font-medium text-green-800 mb-2">Payment Summary</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-green-600">Total Amount:</span>
                                        <span className="ml-2 font-medium">₹{formData.payment_amount.toFixed(2)}</span>
                                    </div>
                                    <div>
                                        <span className="text-green-600">Students:</span>
                                        <span className="ml-2 font-medium">{studentCount}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200">
                        <div className="flex space-x-2">
                            {canCancel && formData.class_status !== 'cancelled' && (
                                <button
                                    onClick={() => handleInputChange('class_status', 'cancelled')}
                                    className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                >
                                    Cancel Class
                                </button>
                            )}
                            {canReactivate && formData.class_status === 'cancelled' && (
                                <button
                                    onClick={() => handleInputChange('class_status', 'scheduled')}
                                    className="px-4 py-2 text-sm font-medium text-green-700 bg-green-100 border border-green-300 rounded-md hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                >
                                    Reactivate Class
                                </button>
                            )}
                        </div>

                        <div className="flex space-x-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            >
                                {saving ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
