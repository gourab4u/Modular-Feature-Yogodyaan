// Shared assignment related types

// Basic payment status (extend if DB enum expanded)
export type PaymentStatus =
    | 'pending'
    | 'paid'
    | 'approved'
    | 'reversed'
    | 'withheld';

export type ClassStatus =
    | 'scheduled'
    | 'completed'
    | 'canceled'
    | 'not_conducted'
    | 'rescheduled';

export interface ClassTypeRef {
    id: string;
    name: string;
    description?: string | null;
    difficulty_level?: string | null;
    duration_minutes?: number | null;
}

export interface InstructorUpcomingAssignment {
    assignment_id: string;          // from view (alias of class_assignments.id)
    instructor_id: string;
    date: string;                   // YYYY-MM-DD
    start_time: string;             // HH:MM
    end_time: string;               // HH:MM
    schedule_type: string;          // 'weekly' | 'adhoc' etc.
    booking_type?: string | null;   // Added for dashboard display
    participant_count?: number | null; // Added for dashboard display
    class_package_id?: string | null; // Added for package class linkage
    scheduled_class_id?: string | null; // For weekly class linkage
    class_status: ClassStatus;
    payment_status: PaymentStatus | null;
    payment_amount: number | null;
    override_payment_amount: number | null;
    final_payment_amount: number | null;
    timezone?: string | null;
    attendance_locked: boolean;
    present_count: number;
    no_show_count: number;
    avg_rating: number;
    rating_count: number;
    // Optional relational expansions when querying directly from class_assignments
    class_types?: ClassTypeRef | null;
}

export interface AdminClassOverview {
    assignment_id: string;
    instructor_id: string;
    date: string;
    start_time: string;
    end_time: string;
    class_status: ClassStatus;
    payment_status: PaymentStatus | null;
    final_payment_amount: number | null;
    class_type_name?: string | null;
    class_type_description?: string | null;
    class_type_difficulty?: string | null;
    class_type_duration?: number | null;
    schedule_type?: string | null;
    timezone?: string | null;
    attended_count: number;
    absent_count: number;
    no_show_count: number;
    avg_rating: number | null;
    ratings_submitted: number;
}

export interface PayoutSummary {
    payment_status: PaymentStatus;
    total_amount: number;
    class_count: number;
}

export interface AttendanceAggregate {
    assignment_id: string;
    present_count: number;
    no_show_count: number;
    attended_count?: number;
    absent_count?: number;
}
