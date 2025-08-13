import { ChevronDown, User, Calendar, Clock, Phone, Mail } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Booking } from '../types'

interface BookingSelectorProps {
    bookings: Booking[]
    selectedBookingId: string
    onBookingSelect: (bookingId: string, clientName: string, clientEmail: string) => void
    bookingTypeFilter?: 'individual' | 'corporate' | 'private_group' | 'public_group' | null
    assignmentType?: string
}

export const BookingSelector = ({ 
    bookings, 
    selectedBookingId, 
    onBookingSelect,
    bookingTypeFilter,
    assignmentType
}: BookingSelectorProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    // Close dropdown and clear search when assignment type changes
    useEffect(() => {
        setIsOpen(false)
        setSearchTerm('')
    }, [assignmentType])

    // Filter bookings based on assignment type, booking type, course type, status, and search term
    const filteredBookings = bookings.filter(booking => {
        // Only show bookings that have a booking_id (required for foreign key constraint)
        if (!booking.booking_id || booking.booking_id.trim() === '') {
            return false
        }
        // Filter by status - only show pending/confirmed, not completed/cancelled/assigned
        const matchesStatus = ['pending', 'confirmed'].includes(booking.status)
        
        // Filter by booking type based on assignment type
        let matchesBookingType = true
        let matchesCourseType = true
        
        if (assignmentType === 'weekly') {
            // Weekly classes - show only public group bookings
            // Also include bookings where booking_type is null/undefined as a fallback
            matchesBookingType = booking.booking_type === 'public_group' || 
                                (!booking.booking_type && booking.status === 'confirmed')
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
                // Filter by course_type if package exists
                if (booking.class_packages && booking.class_packages.course_type) {
                    matchesCourseType = booking.class_packages.course_type === 'crash'
                } else if (booking.class_package_id) {
                    // If package ID exists but package data not loaded, allow it (will be filtered at runtime)
                    matchesCourseType = true
                } else {
                    // If no package linked at all, exclude from crash course assignments
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
        })
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
        })
    }

    const selectedBooking = bookings.find(b => b.booking_id === selectedBookingId)

    const handleBookingSelect = (booking: Booking) => {
        console.log('BOOKING SELECTOR DEBUG - Selected booking:', booking)
        console.log('BOOKING SELECTOR DEBUG - booking.booking_id:', booking.booking_id)
        console.log('BOOKING SELECTOR DEBUG - booking.id:', booking.id)
        // Only pass booking_id if it exists and is not empty, otherwise pass empty string
        const bookingIdToPass = booking.booking_id && booking.booking_id.trim() !== '' ? booking.booking_id : ''
        console.log('BOOKING SELECTOR DEBUG - Will pass:', bookingIdToPass)
        onBookingSelect(bookingIdToPass, `${booking.first_name} ${booking.last_name}`, booking.email)
        setIsOpen(false)
        setSearchTerm('')
    }

    const clearSelection = () => {
        onBookingSelect('', '', '')
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

    return (
        <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
                Link to Booking (Optional)
            </label>
            
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-left flex items-center justify-between"
                >
                    <span className="flex-1">
                        {selectedBooking ? (
                            <div className="flex items-center">
                                <User className="w-4 h-4 mr-2 text-gray-400" />
                                <span className="font-medium">{selectedBooking.first_name} {selectedBooking.last_name}</span>
                                <span className="ml-2 text-sm text-gray-500">({selectedBooking.email})</span>
                                <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(selectedBooking.status)}`}>
                                    {selectedBooking.status}
                                </span>
                            </div>
                        ) : (
                            <span className="text-gray-500">Select a booking...</span>
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
                                onClick={clearSelection}
                                className="w-full px-3 py-2 text-left hover:bg-gray-50 text-sm text-gray-600"
                            >
                                <span className="italic">No booking (manual entry)</span>
                            </button>
                        </div>

                        {/* Bookings list */}
                        <div className="max-h-60 overflow-y-auto">
                            {filteredBookings.length === 0 ? (
                                <div className="p-3 text-sm text-gray-500">
                                    <div className="text-center mb-2">
                                        {searchTerm ? 'No bookings match your search' : 
                                         assignmentType === 'weekly' ? 
                                         'No public group bookings available. Weekly classes require bookings with booking_type = "public_group" or confirmed bookings without a booking type.' :
                                         assignmentType === 'crash_course' ?
                                         'No corporate crash course bookings available. Crash courses require bookings with booking_type = "corporate" and linked to crash course packages (course_type = "crash").' :
                                         'No available bookings'}
                                    </div>
                                    {(assignmentType === 'weekly' || assignmentType === 'crash_course') && bookings.length > 0 && (
                                        <div className="text-xs text-gray-400 border-t pt-2">
                                            <div>Debug info:</div>
                                            <div>Total bookings: {bookings.length}</div>
                                            <div>Booking types: {[...new Set(bookings.map(b => b.booking_type || 'null'))].join(', ')}</div>
                                            <div>Statuses: {[...new Set(bookings.map(b => b.status))].join(', ')}</div>
                                            {assignmentType === 'crash_course' && (
                                                <>
                                                    <div>Package course types: {[...new Set(bookings.map(b => b.class_packages?.course_type || 'null'))].join(', ')}</div>
                                                    <div>Bookings with package ID: {bookings.filter(b => b.class_package_id).length}</div>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                filteredBookings.map((booking) => (
                                    <button
                                        key={booking.id}
                                        type="button"
                                        onClick={() => handleBookingSelect(booking)}
                                        className={`w-full px-3 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                                            selectedBookingId === (booking.booking_id || booking.id) ? 'bg-blue-50' : ''
                                        }`}
                                    >
                                        <div className="space-y-1">
                                            {/* Client name and status */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <User className="w-4 h-4 mr-2 text-gray-400" />
                                                    <span className="font-medium text-gray-900">{booking.first_name} {booking.last_name}</span>
                                                </div>
                                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                                                    {booking.status}
                                                </span>
                                            </div>

                                            {/* Contact info */}
                                            <div className="flex items-center text-sm text-gray-600">
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
                                            <div className="text-sm text-gray-600">
                                                <span className="font-medium">Class:</span> {booking.class_name || 'Unknown'}
                                            </div>

                                            {/* Preferred days and times */}
                                            {(booking.preferred_days?.length || booking.preferred_times?.length || booking.class_date || booking.class_time) && (
                                                <div className="text-sm text-gray-600">
                                                    {/* Multiple preferred days and times */}
                                                    {booking.preferred_days?.length && booking.preferred_times?.length ? (
                                                        <div className="space-y-1">
                                                            <div className="flex items-center">
                                                                <Calendar className="w-3 h-3 mr-1" />
                                                                <span className="font-medium">Preferred Days:</span>
                                                            </div>
                                                            <div className="ml-4 space-y-0.5">
                                                                {booking.preferred_days.slice(0, 2).map((day, index) => (
                                                                    <div key={index} className="flex items-center">
                                                                        <span className="mr-2">{day}</span>
                                                                        {booking.preferred_times?.[index] && (
                                                                            <>
                                                                                <Clock className="w-3 h-3 mr-1" />
                                                                                <span>{formatTime(booking.preferred_times[index])}</span>
                                                                            </>
                                                                        )}
                                                                        {booking.timezone && (
                                                                            <span className="ml-1 text-xs text-gray-500">({booking.timezone})</span>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                                {booking.preferred_days.length > 2 && (
                                                                    <div className="text-xs text-gray-500">
                                                                        +{booking.preferred_days.length - 2} more...
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        /* Fallback to single date/time for backward compatibility */
                                                        <div className="flex items-center">
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
                                            )}

                                            {/* Notes section removed as it's not in the new structure */}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Selected booking details */}
            {selectedBooking && (
                <div className="mt-2 p-3 bg-blue-50 rounded-md border border-blue-200">
                    <div className="text-sm">
                        <div className="font-medium text-blue-900 mb-1">Linked Booking Details:</div>
                        <div className="text-blue-800">
                            <div><strong>Client:</strong> {selectedBooking.first_name} {selectedBooking.last_name}</div>
                            <div><strong>Email:</strong> {selectedBooking.email}</div>
                            {selectedBooking.phone && (
                                <div><strong>Phone:</strong> {selectedBooking.phone}</div>
                            )}
                            <div><strong>Class:</strong> {selectedBooking.class_name || 'Unknown'}</div>
                            
                            {/* Preferred days and times */}
                            {selectedBooking.preferred_days?.length && selectedBooking.preferred_times?.length ? (
                                <div className="mt-2">
                                    <div><strong>Preferred Days & Times:</strong></div>
                                    <div className="ml-4 space-y-1 mt-1">
                                        {selectedBooking.preferred_days.map((day, index) => (
                                            <div key={index} className="flex items-center text-sm">
                                                <Calendar className="w-3 h-3 mr-1" />
                                                <span className="mr-2">{day}</span>
                                                {selectedBooking.preferred_times?.[index] && (
                                                    <>
                                                        <Clock className="w-3 h-3 mr-1" />
                                                        <span>{formatTime(selectedBooking.preferred_times[index])}</span>
                                                    </>
                                                )}
                                                {selectedBooking.timezone && (
                                                    <span className="ml-1 text-xs text-blue-500">({selectedBooking.timezone})</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                /* Fallback to single date/time for backward compatibility */
                                <>
                                    {selectedBooking.class_date && (
                                        <div><strong>Date:</strong> {formatDate(selectedBooking.class_date)}</div>
                                    )}
                                    {selectedBooking.class_time && (
                                        <div><strong>Time:</strong> {formatTime(selectedBooking.class_time)}</div>
                                    )}
                                </>
                            )}
                            <div><strong>Status:</strong> 
                                <span className={`ml-1 px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(selectedBooking.status)}`}>
                                    {selectedBooking.status}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}