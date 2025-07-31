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
    // Instructor status fields
    instructor_status?: 'pending' | 'accepted' | 'rejected'
    instructor_response_at?: string
    // Client information
    client_name?: string
    client_email?: string
    booking_id?: string
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
    client_name: string
    client_email: string
    client_phone?: string
    class_type_id: string
    preferred_date?: string
    preferred_time?: string
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
    created_at: string
    notes?: string
    class_type?: {
        id: string
        name: string
        difficulty_level: string
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

    // New timezone support
    timezone: string

    // New assignment method fields
    monthly_assignment_method: 'weekly_recurrence' | 'manual_calendar'

    // Weekly recurrence fields
    weekly_days: number[] // [1,3,5] for Mon,Wed,Fri (0=Sunday, 6=Saturday)

    // Manual calendar selections
    manual_selections: ManualClassSelection[]

    // Booking reference fields
    booking_id: string
    client_name: string
    client_email: string

    // Weekly template assignment
    selected_template_id: string
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