import { X, Users, Save, AlertTriangle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { ClassAssignment, Booking, UserProfile } from '../types'
import { MultipleBookingSelector } from './MultipleBookingSelector'

interface EditAssignmentModalProps {
    assignment: ClassAssignment | null
    isVisible: boolean
    bookings: Booking[]
    userProfiles: UserProfile[]
    onClose: () => void
    onSave: (assignmentId: string, updates: Partial<ClassAssignment>) => Promise<void>
}

export const EditAssignmentModal = ({ 
    assignment, 
    isVisible, 
    bookings, 
    onClose, 
    onSave 
}: EditAssignmentModalProps) => {
    const [formData, setFormData] = useState({
        class_status: '',
        payment_amount: 0,
        payment_status: '',
        notes: '',
        booking_ids: [] as string[]
    })
    const [saving, setSaving] = useState(false)
    const [studentCount, setStudentCount] = useState(1)

    useEffect(() => {
        if (assignment) {
            // Convert single booking_id to array for backwards compatibility
            // But first validate that the booking exists
            let bookingIds: string[] = []
            if (assignment.booking_id) {
                const bookingExists = bookings.find(b => b.id === assignment.booking_id)
                if (bookingExists) {
                    bookingIds = [assignment.booking_id]
                } else {
                    console.warn(`Assignment has booking ID ${assignment.booking_id} but booking not found in available bookings`)
                    // Don't include the invalid booking ID
                }
            }
            
            setFormData({
                class_status: assignment.class_status || 'scheduled',
                payment_amount: assignment.payment_amount || 0,
                payment_status: assignment.payment_status || 'pending',
                notes: assignment.notes || '',
                booking_ids: bookingIds
            })
            
            // Calculate current student count based on selected bookings
            setStudentCount(bookingIds.length > 0 ? bookingIds.length : 1)
        }
    }, [assignment, bookings])

    if (!isVisible || !assignment) return null

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const handleBookingSelectionChange = (bookingIds: string[]) => {
        setFormData(prev => ({
            ...prev,
            booking_ids: bookingIds
        }))
        
        // Update student count based on booking selections (each booking = 1 student)
        setStudentCount(bookingIds.length > 0 ? bookingIds.length : 1)
    }


    const handleSave = async () => {
        if (!assignment) return

        try {
            setSaving(true)
            
            // For now, we'll save the first booking ID to maintain compatibility with the current database schema
            // In the future, this should be updated to support multiple booking IDs in the database
            const primaryBookingId = formData.booking_ids.length > 0 ? formData.booking_ids[0] : null
            
            const updates: Partial<ClassAssignment> = {
                class_status: formData.class_status as any,
                payment_amount: formData.payment_amount,
                payment_status: formData.payment_status as any,
                notes: formData.notes || undefined,
                booking_id: primaryBookingId
            }

            await onSave(assignment.id, updates)
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

                        {/* Invalid Booking Warning */}
                        {assignment.booking_id && !bookings.find(b => b.id === assignment.booking_id) && (
                            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <div className="flex items-center">
                                    <AlertTriangle className="w-4 h-4 text-yellow-500 mr-2" />
                                    <div>
                                        <p className="text-sm font-medium text-yellow-800">Invalid Booking Reference</p>
                                        <p className="text-xs text-yellow-700 mt-1">
                                            This assignment was linked to a booking that no longer exists. The booking selection has been cleared.
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