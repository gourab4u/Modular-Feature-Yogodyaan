import { Search, Eye, User, Calendar, Clock } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Button } from './Button'
import { supabase } from '../../lib/supabase'

interface Booking {
  booking_id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  class_name: string
  class_date: string
  class_time: string
  instructor: string
  experience_level: string
  special_requests: string
  status: string
  created_at: string
}

interface BookingDetails {
  booking_id: string
  client_name: string
  client_email: string
  client_phone: string
  requested_class: string
  requested_date: string
  requested_time: string
  experience_level: string
  special_requests: string
  booking_status: string
  has_assignment: boolean
  assignment_date: string
  assignment_time: string
  assigned_instructor: string
}

interface BookingSelectorProps {
  selectedBookingId: string
  onBookingSelect: (bookingId: string, clientName: string, clientEmail: string) => void
  disabled?: boolean
}

export function BookingSelector({ 
  selectedBookingId, 
  onBookingSelect, 
  disabled = false 
}: BookingSelectorProps) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [showBookingDetails, setShowBookingDetails] = useState(false)
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

  useEffect(() => {
    fetchBookings()
  }, [])

  useEffect(() => {
    if (selectedBookingId) {
      const booking = bookings.find(b => b.booking_id === selectedBookingId)
      if (booking) {
        setSelectedBooking(booking)
      }
    }
  }, [selectedBookingId, bookings])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      
      // Fetch bookings that don't have assignments yet (exclude 'completed' and 'cancelled' status)
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .in('status', ['confirmed', 'pending', 'rescheduled'])
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      setBookings(data || [])
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchBookingDetails = async (bookingId: string) => {
    try {
      setLoadingDetails(true)
      
      // Call the PostgreSQL function to get booking details
      const { data, error } = await supabase
        .rpc('get_booking_details', { booking_id_param: bookingId })

      if (error) throw error
      
      if (data && data.length > 0) {
        setBookingDetails(data[0])
      }
    } catch (error) {
      console.error('Error fetching booking details:', error)
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleBookingSelect = (booking: Booking) => {
    setSelectedBooking(booking)
    const clientName = `${booking.first_name} ${booking.last_name}`
    onBookingSelect(booking.booking_id, clientName, booking.email)
    setShowDropdown(false)
  }

  const handleViewDetails = async (bookingId: string) => {
    setShowBookingDetails(true)
    await fetchBookingDetails(bookingId)
  }

  const filteredBookings = bookings.filter(booking => {
    const searchLower = searchTerm.toLowerCase()
    const clientName = `${booking.first_name} ${booking.last_name}`.toLowerCase()
    return (
      booking.booking_id.toLowerCase().includes(searchLower) ||
      clientName.includes(searchLower) ||
      booking.email.toLowerCase().includes(searchLower) ||
      booking.class_name.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Booking Reference (Optional)
      </label>
      
      <div className="relative">
        {/* Selected Booking Display */}
        <div 
          className={`
            w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 
            cursor-pointer transition-colors flex items-center justify-between
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400 dark:hover:border-gray-500'}
            ${showDropdown ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-20' : ''}
          `}
          onClick={() => !disabled && setShowDropdown(!showDropdown)}
        >
          <div className="flex items-center space-x-2 flex-1">
            <User className="w-4 h-4 text-gray-400" />
            {selectedBooking ? (
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {selectedBooking.booking_id}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedBooking.first_name} {selectedBooking.last_name} • {selectedBooking.email}
                </div>
              </div>
            ) : (
              <span className="text-gray-500 dark:text-gray-400">
                Select existing booking or leave empty for new client
              </span>
            )}
          </div>
          
          {selectedBooking && (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleViewDetails(selectedBooking.booking_id)
                }}
                className="p-1"
              >
                <Eye className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Dropdown */}
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-64 overflow-hidden">
            {/* Search */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by Booking ID, name, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>

            {/* Booking List */}
            <div className="max-h-48 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500">Loading bookings...</div>
              ) : filteredBookings.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No bookings found</div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {/* Clear Selection Option */}
                  <div
                    className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => {
                      setSelectedBooking(null)
                      onBookingSelect('', '', '')
                      setShowDropdown(false)
                    }}
                  >
                    <div className="text-sm text-gray-600 dark:text-gray-400 italic">
                      Clear selection (new client)
                    </div>
                  </div>
                  
                  {filteredBookings.map((booking) => (
                    <div
                      key={booking.booking_id}
                      className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => handleBookingSelect(booking)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-blue-600 dark:text-blue-400 text-sm">
                              {booking.booking_id}
                            </span>
                            <span className={`
                              px-2 py-0.5 rounded-full text-xs font-medium
                              ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'}
                            `}>
                              {booking.status}
                            </span>
                          </div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1">
                            {booking.first_name} {booking.last_name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {booking.email} • {booking.phone}
                          </div>
                          <div className="flex items-center space-x-4 mt-1 text-xs text-gray-600 dark:text-gray-400">
                            <span className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>{booking.class_date}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{booking.class_time}</span>
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleViewDetails(booking.booking_id)
                          }}
                          className="p-1 ml-2"
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      {showBookingDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Booking Details
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBookingDetails(false)}
                >
                  ✕
                </Button>
              </div>

              {loadingDetails ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-500">Loading booking details...</div>
                </div>
              ) : bookingDetails ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Booking ID</label>
                      <div className="mt-1 text-sm text-gray-900 dark:text-gray-100 font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        {bookingDetails.booking_id}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                      <div className={`mt-1 inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        bookingDetails.booking_status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        bookingDetails.booking_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {bookingDetails.booking_status}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Client Name</label>
                      <div className="mt-1 text-sm text-gray-900 dark:text-gray-100">{bookingDetails.client_name}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                      <div className="mt-1 text-sm text-gray-900 dark:text-gray-100">{bookingDetails.client_email}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                      <div className="mt-1 text-sm text-gray-900 dark:text-gray-100">{bookingDetails.client_phone}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Experience Level</label>
                      <div className="mt-1 text-sm text-gray-900 dark:text-gray-100">{bookingDetails.experience_level}</div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Requested Class</label>
                    <div className="mt-1 text-sm text-gray-900 dark:text-gray-100">{bookingDetails.requested_class}</div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Requested Date</label>
                      <div className="mt-1 text-sm text-gray-900 dark:text-gray-100">{bookingDetails.requested_date}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Requested Time</label>
                      <div className="mt-1 text-sm text-gray-900 dark:text-gray-100">{bookingDetails.requested_time}</div>
                    </div>
                  </div>

                  {bookingDetails.special_requests && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Special Requests</label>
                      <div className="mt-1 text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-3 rounded">
                        {bookingDetails.special_requests}
                      </div>
                    </div>
                  )}

                  {bookingDetails.has_assignment && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Current Assignment</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Assigned Date</label>
                          <div className="mt-1 text-sm text-gray-900 dark:text-gray-100">{bookingDetails.assignment_date}</div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Assigned Time</label>
                          <div className="mt-1 text-sm text-gray-900 dark:text-gray-100">{bookingDetails.assignment_time}</div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Assigned Instructor</label>
                        <div className="mt-1 text-sm text-gray-900 dark:text-gray-100">{bookingDetails.assigned_instructor}</div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No booking details found
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedBooking && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Selected booking: {selectedBooking.class_name} for {selectedBooking.first_name} {selectedBooking.last_name} on {selectedBooking.class_date}
        </div>
      )}
    </div>
  )
}