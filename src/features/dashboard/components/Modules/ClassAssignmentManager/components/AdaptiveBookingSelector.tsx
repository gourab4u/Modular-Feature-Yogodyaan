import React from 'react'
import { BookingSelector } from './BookingSelector'
import { MultipleBookingSelector } from './MultipleBookingSelector'
import { Booking } from '../types'

interface AdaptiveBookingSelectorProps {
    bookings: Booking[]
    assignmentType: string
    bookingType: string
    // For single booking selection
    selectedBookingId?: string
    onBookingSelect?: (bookingId: string, clientName: string, clientEmail: string) => void
    // For multiple booking selection
    selectedBookingIds?: string[]
    onBookingSelectionChange?: (bookingIds: string[]) => void
    // Common props
    bookingTypeFilter?: 'individual' | 'corporate' | 'private_group' | 'public_group' | null
}

export const AdaptiveBookingSelector: React.FC<AdaptiveBookingSelectorProps> = ({
    bookings,
    assignmentType,
    bookingType,
    selectedBookingId = '',
    onBookingSelect,
    selectedBookingIds = [],
    onBookingSelectionChange,
    bookingTypeFilter
}) => {
    // Determine if this assignment type allows multiple bookings
    const allowsMultipleBookings = shouldAllowMultipleBookings(assignmentType, bookingType)
    
    if (allowsMultipleBookings) {
        // Use MultipleBookingSelector for weekly, corporate, monthly, crash courses
        return (
            <div>
                <MultipleBookingSelector
                    bookings={bookings}
                    selectedBookingIds={selectedBookingIds}
                    onBookingSelectionChange={onBookingSelectionChange || (() => {})}
                    assignmentType={assignmentType}
                    bookingTypeFilter={bookingTypeFilter}
                />
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-700">
                        <strong>Multiple bookings allowed:</strong> You can select multiple bookings for this type of class.
                        Each booking represents one student.
                    </p>
                </div>
            </div>
        )
    } else {
        // Use single BookingSelector for individual and private group classes
        return (
            <div>
                <BookingSelector
                    bookings={bookings}
                    selectedBookingId={selectedBookingId}
                    onBookingSelect={onBookingSelect || (() => {})}
                    assignmentType={assignmentType}
                    bookingTypeFilter={bookingTypeFilter}
                />
                <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                    <p className="text-sm text-amber-700">
                        <strong>Single booking only:</strong> Individual and private group classes can only be linked to one booking.
                    </p>
                </div>
            </div>
        )
    }
}

// Helper function to determine if assignment type allows multiple bookings
const shouldAllowMultipleBookings = (assignmentType: string, bookingType: string): boolean => {
    // Individual classes and private groups: single booking only
    if (assignmentType === 'adhoc' && (bookingType === 'individual' || bookingType === 'private_group')) {
        return false
    }
    
    // All other cases: multiple bookings allowed
    // - Weekly classes (public_group)
    // - Corporate bookings
    // - Monthly packages
    // - Crash courses
    return true
}