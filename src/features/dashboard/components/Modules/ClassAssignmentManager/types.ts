export interface ClassAssignment {
    id: string
    class_type_id: string
    date: string
    start_time: string | null
    end_time: string | null
    instructor_id: string
    payment_amount: number
    notes?: string
    class_status?: 'scheduled' | 'completed' | 'cancelled'
    payment_status?: 'pending' | 'paid' | 'cancelled'
    payment_date?: string
    assigned_at: string
    assigned_by: string
    schedule_type: string
    booking_type: 'individual' | 'corporate' | 'private_group' | 'public_group'
    package_id?: string
    class_package_id?: string
    // Instructor status fields
    instructor_status?: 'pending' | 'accepted' | 'rejected'
    instructor_response_at?: string
    // Multiple booking support
    assignment_bookings?: AssignmentBooking[]
    bookings?: Booking[] // Populated bookings for convenience
    class_type?: {
        id: string
        name: string
        difficulty_level: string
    }
    package?: {
        id: string
        name: string
        description?: string
        class_count?: number
        validity_days?: number
    }
    instructor_profile?: {
        user_id: string
        full_name: string
        email: string
    }
}

export interface AssignmentBooking {
    id: string
    assignment_id: string
    booking_id: string
    created_at: string
    booking?: Booking // Populated booking data
}

export interface ClassSchedule {
    id: string
    class_type_id: string
    day_of_week: number // 0 = Sunday, 1 = Monday, etc.
    start_time: string
    end_time: string
    instructor_id: string | null
    duration_minutes: number
    max_participants: number
    is_active?: boolean
    effective_from?: string
    effective_until?: string
    notes?: string
    class_type?: {
        id: string
        name: string
        difficulty_level: string
    }
    instructor_profile?: {
        user_id: string
        full_name: string
        email: string
    }
}

export interface UserProfile {
    user_id: string
    full_name: string
    email: string
    user_roles: {
        roles: {
            name: string
        }
    }[]
}

export interface ConflictDetails {
    hasConflict: boolean
    conflictingClass?: ClassAssignment | ClassSchedule
    message?: string
    conflictType?: 'instructor' | 'resource' | 'capacity' | 'timing'
    severity?: 'warning' | 'error'
    suggestions?: string[]
}

export interface ClassType {
    id: string
    name: string
    difficulty_level: string
}

export interface Package {
    id: string
    name: string
    description?: string
    duration: string
    price: number
    class_count: number
    validity_days?: number
    type?: string
    course_type: 'regular' | 'crash'
    is_active: boolean
}

export interface Booking {
    id: string
    booking_id?: string // TEXT field in format YOG-YYYYMMDD-XXXX
    user_id: string
    class_name: string
    instructor: string
    class_date: string
    class_time: string
    // Multiple preferred days and times from database
    preferred_days?: string[] // Array of preferred days
    preferred_times?: string[] // Array of preferred times
    timezone?: string // Timezone for the preferred times
    first_name: string
    last_name: string
    email: string
    phone: string
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
    created_at: string
    booking_type?: 'individual' | 'corporate' | 'private_group' | 'public_group'
    class_package_id?: string
    class_packages?: {
        id: string
        name: string
        description?: string
        price?: number
        class_count?: number
        validity_days?: number
        type?: string
        duration?: string
        course_type?: string
    }
}

export interface ManualClassSelection {
    date: string
    start_time: string
    end_time: string
    timezone: string
}

export interface FormData {
    assignment_type: 'adhoc' | 'weekly' | 'monthly' | 'crash_course' | 'package'
    class_type_id: string
    instructor_id: string
    payment_amount: number
    payment_type: 'per_class' | 'monthly' | 'total_duration' | 'per_member' | 'per_class_total' | 'per_student_per_class'
    notes: string
    date: string
    start_time: string
    end_time: string
    duration: number
    start_date: string
    end_date: string
    day_of_week: number
    day_of_month: number
    course_duration_value: number
    course_duration_unit: 'weeks' | 'months'
    class_frequency: 'daily' | 'weekly' | 'specific'
    specific_days: number[]
    package_id: string
    timeline_description: string
    total_classes: number
    booking_type: 'individual' | 'corporate' | 'private_group' | 'public_group'

    // New timezone support
    timezone: string

    // New assignment method fields
    monthly_assignment_method: 'weekly_recurrence' | 'manual_calendar'

    // Weekly recurrence fields
    weekly_days: number[] // [1,3,5] for Mon,Wed,Fri (0=Sunday, 6=Saturday)

    // Manual calendar selections
    manual_selections: ManualClassSelection[]

    // Booking reference fields (legacy single booking support)
    booking_id: string
    client_name: string
    client_email: string

    // Multiple booking support
    booking_ids: string[]

    // Weekly template assignment
    selected_template_id: string

    // Package validity constraint
    validity_end_date: string
}

export interface ValidationErrors {
    [key: string]: string
}

export interface TimeZoneInfo {
    timeZone: string
    offset: number
    isDST: boolean
}

export interface LoadingStates {
    creatingAssignment: boolean
    updatingStatus: boolean
    deletingAssignment: boolean
    checkingConflicts: boolean
    fetchingData: boolean
}

export interface Filters {
    dateRange: { start: string; end: string }
    assignmentTypes: string[]
    classStatus: string[]
    paymentStatus: string[]
    instructors: string[]
    classTypes: string[]
    packages: string[]
    clientName: string
    weeklyClasses: boolean
}

// Helper functions for working with the new multiple booking structure
export const getClientNames = (assignment: ClassAssignment): string => {
    if (!assignment.assignment_bookings?.length) {
        return ''
    }

    const names = assignment.assignment_bookings
        .map(ab => ab.booking ? `${ab.booking.first_name} ${ab.booking.last_name}`.trim() : '')
        .filter(name => name !== '')

    return names.join(', ')
}

// New helper function for primary client + count display
export const getPrimaryClientDisplay = (assignment: ClassAssignment): string => {
    if (!assignment.assignment_bookings?.length) {
        return ''
    }

    const names = assignment.assignment_bookings
        .map(ab => ab.booking ? `${ab.booking.first_name} ${ab.booking.last_name}`.trim() : '')
        .filter(name => name !== '')

    if (names.length === 0) return ''
    if (names.length === 1) return names[0]

    return `${names[0]} + ${names.length - 1} others`
}

// Helper function to get detailed booking information
export const getBookingDetails = (assignment: ClassAssignment): Array<{ name: string, email: string, bookingId: string }> => {
    if (!assignment.assignment_bookings?.length) {
        return []
    }

    return assignment.assignment_bookings
        .map(ab => ({
            name: ab.booking ? `${ab.booking.first_name} ${ab.booking.last_name}`.trim() : '',
            email: ab.booking?.email || '',
            bookingId: ab.booking_id
        }))
        .filter(detail => detail.name !== '')
}

export const getClientEmails = (assignment: ClassAssignment): string => {
    if (!assignment.assignment_bookings?.length) {
        return ''
    }

    const emails = assignment.assignment_bookings
        .map(ab => ab.booking?.email || '')
        .filter(email => email !== '')

    return emails.join(', ')
}

export const getBookingIds = (assignment: ClassAssignment): string[] => {
    if (!assignment.assignment_bookings?.length) {
        return []
    }

    return assignment.assignment_bookings.map(ab => ab.booking_id)
}
