import { ChevronDown, User, Calendar, Clock, Phone, Mail, X, Check } from 'lucide-react'
import { useState } from 'react'
import { Booking } from '../types'

interface MultipleBookingSelectorProps {
    bookings: Booking[]
    selectedBookingIds: string[]
    onBookingSelectionChange: (bookingIds: string[]) => void
    bookingTypeFilter?: 'individual' | 'corporate' | 'private_group' | 'public_group' | null
    assignmentType?: string
}

export const MultipleBookingSelector = ({ 
    bookings, 
    selectedBookingIds, 
    onBookingSelectionChange,
    bookingTypeFilter,
    assignmentType
}: MultipleBookingSelectorProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    // Filter bookings based on assignment type, booking type, course type, status, and search term
    const filteredBookings = bookings.filter(booking => {
        // Filter by status - only show pending/confirmed, not completed/cancelled/assigned
        const matchesStatus = ['pending', 'confirmed'].includes(booking.status)
        
        // Filter by booking type based on assignment type
        let matchesBookingType = true
        let matchesCourseType = true
        
        if (assignmentType === 'weekly') {
            // Weekly classes - show only public group bookings
            matchesBookingType = booking.booking_type === 'public_group'
            matchesCourseType = true // Allow any course type for weekly
        } else if (assignmentType === 'monthly') {
            // Monthly packages should show selected booking type with regular course type
            if (bookingTypeFilter && bookingTypeFilter.trim() !== '') {
                matchesBookingType = booking.booking_type === bookingTypeFilter
                // Filter by course_type if package exists, otherwise allow booking
                if (booking.class_packages && booking.class_packages.course_type) {
                    matchesCourseType = booking.class_packages.course_type === 'regular'
                } else {
                    // If no package linked, allow the booking (might be individual bookings without packages)
                    matchesCourseType = true
                }
            } else {
                matchesBookingType = false // Don't show any bookings until type is selected
            }
        } else if (assignmentType === 'crash_course') {
            // Crash courses should show selected booking type with crash course type
            if (bookingTypeFilter && bookingTypeFilter.trim() !== '') {
                matchesBookingType = booking.booking_type === bookingTypeFilter
                // Filter by course_type if package exists, otherwise exclude booking for crash courses
                if (booking.class_packages && booking.class_packages.course_type) {
                    matchesCourseType = booking.class_packages.course_type === 'crash'
                } else {
                    // If no package linked, exclude from crash course assignments
                    matchesCourseType = false
                }
            } else {
                matchesBookingType = false // Don't show any bookings until type is selected
            }
        } else if (bookingTypeFilter && bookingTypeFilter.trim() !== '') {
            // For adhoc and package forms, filter by selected booking type, any course type
            matchesBookingType = booking.booking_type === bookingTypeFilter
            // matchesCourseType remains true (any course type)
        }
        // If no booking type filter and not weekly/monthly/crash, show all booking types and course types
        
        const matchesSearch = !searchTerm || 
            `${booking.first_name} ${booking.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            booking.email.toLowerCase().includes(searchTerm.toLowerCase())
        
        return matchesStatus && matchesBookingType && matchesCourseType && matchesSearch
    })

    const selectedBookings = bookings.filter(b => selectedBookingIds.includes(b.booking_id || ''))

    const handleBookingToggle = (booking: Booking) => {
        const bookingId = booking.booking_id || ''
        const newSelectedIds = selectedBookingIds.includes(bookingId)
            ? selectedBookingIds.filter(id => id !== bookingId)
            : [...selectedBookingIds, bookingId]
        
        onBookingSelectionChange(newSelectedIds)
    }

    const clearAllSelections = () => {
        onBookingSelectionChange([])
        setIsOpen(false)
    }

    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return 'No date'
        return new Date(dateString).toLocaleDateString()
    }

    const formatTime = (timeString: string | undefined) => {
        if (!timeString) return 'No time'
        return timeString
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800'
            case 'confirmed': return 'bg-blue-100 text-blue-800'
            case 'completed': return 'bg-green-100 text-green-800'
            case 'cancelled': return 'bg-red-100 text-red-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const removeBooking = (bookingId: string) => {
        const newSelectedIds = selectedBookingIds.filter(id => id !== bookingId)
        onBookingSelectionChange(newSelectedIds)
    }

    return (
        <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
                Link to Bookings (Optional)
            </label>
            
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-left flex items-center justify-between min-h-[40px]"
                >
                    <span className="flex-1">
                        {selectedBookings.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                                {selectedBookings.slice(0, 2).map((booking) => (
                                    <span 
                                        key={booking.id}
                                        className="inline-flex items-center bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full"
                                    >
                                        {booking.first_name} {booking.last_name}
                                    </span>
                                ))}
                                {selectedBookings.length > 2 && (
                                    <span className="inline-flex items-center bg-gray-100 text-gray-600 text-xs font-medium px-2 py-1 rounded-full">
                                        +{selectedBookings.length - 2} more
                                    </span>
                                )}
                            </div>
                        ) : (
                            <span className="text-gray-500">Select bookings...</span>
                        )}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-hidden">
                        {/* Search */}
                        <div className="p-3 border-b border-gray-200">
                            <input
                                type="text"
                                placeholder="Search bookings..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                autoFocus
                            />
                        </div>

                        {/* Clear selection option */}
                        <div className="border-b border-gray-200">
                            <button
                                type="button"
                                onClick={clearAllSelections}
                                className="w-full px-3 py-2 text-left hover:bg-gray-50 text-sm text-gray-600"
                            >
                                <span className="italic">Clear all selections</span>
                            </button>
                        </div>

                        {/* Bookings list */}
                        <div className="max-h-60 overflow-y-auto">
                            {filteredBookings.length === 0 ? (
                                <div className="p-3 text-sm text-gray-500 text-center">
                                    {searchTerm ? 'No bookings match your search' : 'No available bookings'}
                                </div>
                            ) : (
                                filteredBookings.map((booking) => (
                                    <button
                                        key={booking.id}
                                        type="button"
                                        onClick={() => handleBookingToggle(booking)}
                                        className={`w-full px-3 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                                            selectedBookingIds.includes(booking.booking_id || '') ? 'bg-blue-50' : ''
                                        }`}
                                    >
                                        <div className="space-y-1">
                                            {/* Client name, status, and checkbox */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <div className={`w-4 h-4 mr-2 border-2 rounded flex items-center justify-center ${
                                                        selectedBookingIds.includes(booking.booking_id || '') 
                                                            ? 'bg-blue-600 border-blue-600' 
                                                            : 'border-gray-300'
                                                    }`}>
                                                        {selectedBookingIds.includes(booking.booking_id || '') && (
                                                            <Check className="w-3 h-3 text-white" />
                                                        )}
                                                    </div>
                                                    <User className="w-4 h-4 mr-2 text-gray-400" />
                                                    <span className="font-medium text-gray-900">{booking.first_name} {booking.last_name}</span>
                                                </div>
                                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                                                    {booking.status}
                                                </span>
                                            </div>

                                            {/* Contact info */}
                                            <div className="flex items-center text-sm text-gray-600 ml-6">
                                                <Mail className="w-3 h-3 mr-1" />
                                                <span className="mr-3">{booking.email}</span>
                                                {booking.phone && (
                                                    <>
                                                        <Phone className="w-3 h-3 mr-1" />
                                                        <span>{booking.phone}</span>
                                                    </>
                                                )}
                                            </div>

                                            {/* Class type */}
                                            <div className="text-sm text-gray-600 ml-6">
                                                <span className="font-medium">Class:</span> {booking.class_name || 'Unknown'}
                                            </div>

                                            {/* Preferred date/time */}
                                            {(booking.class_date || booking.class_time) && (
                                                <div className="flex items-center text-sm text-gray-600 ml-6">
                                                    <Calendar className="w-3 h-3 mr-1" />
                                                    <span className="mr-2">{formatDate(booking.class_date)}</span>
                                                    {booking.class_time && (
                                                        <>
                                                            <Clock className="w-3 h-3 mr-1" />
                                                            <span>{formatTime(booking.class_time)}</span>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Selected bookings details */}
            {selectedBookings.length > 0 && (
                <div className="mt-2 p-3 bg-blue-50 rounded-md border border-blue-200">
                    <div className="text-sm">
                        <div className="font-medium text-blue-900 mb-2">
                            Selected Bookings ({selectedBookings.length}):
                        </div>
                        <div className="space-y-2">
                            {selectedBookings.map((booking) => (
                                <div key={booking.id} className="flex items-center justify-between text-blue-800 bg-white rounded px-2 py-1">
                                    <div className="flex-1">
                                        <div><strong>{booking.first_name} {booking.last_name}</strong> - {booking.email}</div>
                                        <div className="text-xs">{booking.class_name || 'Unknown'}</div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeBooking(booking.booking_id || '')}
                                        className="ml-2 text-red-600 hover:text-red-800"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}