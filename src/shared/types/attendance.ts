// Attendance related shared types

export type AttendanceStatus =
    | 'present'
    | 'late'
    | 'absent_excused'
    | 'absent_unexcused'
    | 'no_show'
    | 'canceled_by_student'
    | 'canceled_by_instructor'
    | 'makeup_scheduled'
    | 'makeup_completed';

export const ATTENDANCE_STATUSES: AttendanceStatus[] = [
    'present',
    'late',
    'absent_excused',
    'absent_unexcused',
    'no_show',
    'canceled_by_student',
    'canceled_by_instructor',
    'makeup_scheduled',
    'makeup_completed'
];

export interface AttendanceRecord {
    id: string;
    assignment_id: string;
    member_id: string;
    status: AttendanceStatus;
    notes: string | null;
    marked_by: string;
    marked_at: string;        // ISO string
    updated_at: string;       // ISO string
    makeup_of_assignment_id?: string | null;
}

// Metadata interface (implemented in constants file)
export interface AttendanceStatusMetadata {
    label: string;
    description: string;
    color: string;            // tailwind color token or hex
    affectsPayout: boolean;
    terminal?: boolean;       // marks statuses that end participation
    negative?: boolean;       // for styling (e.g. red)
    neutral?: boolean;        // neutral status (e.g. cancellations)
    positive?: boolean;       // positive attendance
}
