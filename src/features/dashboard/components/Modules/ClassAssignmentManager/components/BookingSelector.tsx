import { ChevronDown, User, Calendar, Clock, Phone, Mail } from 'lucide-react'
import { useState } from 'react'
import { Booking } from '../types'

interface BookingSelectorProps {
    bookings: Booking[]
    selectedBookingId: string
    onBookingSelect: (bookingId: string, clientName: string, clientEmail: string) => void
    classTypeId?: string
}

export const BookingSelector = ({ 
    bookings, 
    selectedBookingId, 
    onBookingSelect, 
    classTypeId 
}: BookingSelectorProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    // Filter bookings by class type if specified, and by search term
    const filteredBookings = bookings.filter(booking => {
        const matchesClassType = !classTypeId || booking.class_type_id === classTypeId
        const matchesSearch = !searchTerm || 
            booking.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            booking.client_email.toLowerCase().includes(searchTerm.toLowerCase())
        
        return matchesClassType && matchesSearch
    })

    const selectedBooking = bookings.find(b => b.id === selectedBookingId)

    const handleBookingSelect = (booking: Booking) => {
        onBookingSelect(booking.id, booking.client_name, booking.client_email)
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
                                <span className="font-medium">{selectedBooking.client_name}</span>
                                <span className="ml-2 text-sm text-gray-500">({selectedBooking.client_email})</span>
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
                                <div className="p-3 text-sm text-gray-500 text-center">
                                    {searchTerm ? 'No bookings match your search' : 'No available bookings'}
                                </div>
                            ) : (
                                filteredBookings.map((booking) => (
                                    <button
                                        key={booking.id}
                                        type="button"
                                        onClick={() => handleBookingSelect(booking)}
                                        className={`w-full px-3 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                                            selectedBookingId === booking.id ? 'bg-blue-50' : ''
                                        }`}
                                    >
                                        <div className="space-y-1">
                                            {/* Client name and status */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <User className="w-4 h-4 mr-2 text-gray-400" />
                                                    <span className="font-medium text-gray-900">{booking.client_name}</span>
                                                </div>
                                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                                                    {booking.status}
                                                </span>
                                            </div>

                                            {/* Contact info */}
                                            <div className="flex items-center text-sm text-gray-600">
                                                <Mail className="w-3 h-3 mr-1" />
                                                <span className="mr-3">{booking.client_email}</span>
                                                {booking.client_phone && (
                                                    <>
                                                        <Phone className="w-3 h-3 mr-1" />
                                                        <span>{booking.client_phone}</span>
                                                    </>
                                                )}
                                            </div>

                                            {/* Class type */}
                                            <div className="text-sm text-gray-600">
                                                <span className="font-medium">Class:</span> {booking.class_type?.name || 'Unknown'}
                                            </div>

                                            {/* Preferred date/time */}
                                            {(booking.preferred_date || booking.preferred_time) && (
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <Calendar className="w-3 h-3 mr-1" />
                                                    <span className="mr-2">{formatDate(booking.preferred_date)}</span>
                                                    {booking.preferred_time && (
                                                        <>
                                                            <Clock className="w-3 h-3 mr-1" />
                                                            <span>{formatTime(booking.preferred_time)}</span>
                                                        </>
                                                    )}
                                                </div>
                                            )}

                                            {/* Notes */}
                                            {booking.notes && (
                                                <div className="text-xs text-gray-500 italic truncate">
                                                    {booking.notes}
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

            {/* Selected booking details */}
            {selectedBooking && (
                <div className="mt-2 p-3 bg-blue-50 rounded-md border border-blue-200">
                    <div className="text-sm">
                        <div className="font-medium text-blue-900 mb-1">Linked Booking Details:</div>
                        <div className="text-blue-800">
                            <div><strong>Client:</strong> {selectedBooking.client_name}</div>
                            <div><strong>Email:</strong> {selectedBooking.client_email}</div>
                            {selectedBooking.client_phone && (
                                <div><strong>Phone:</strong> {selectedBooking.client_phone}</div>
                            )}
                            <div><strong>Class Type:</strong> {selectedBooking.class_type?.name || 'Unknown'}</div>
                            {selectedBooking.preferred_date && (
                                <div><strong>Preferred Date:</strong> {formatDate(selectedBooking.preferred_date)}</div>
                            )}
                            {selectedBooking.preferred_time && (
                                <div><strong>Preferred Time:</strong> {formatTime(selectedBooking.preferred_time)}</div>
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