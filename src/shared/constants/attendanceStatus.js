// Attendance status metadata & helper utilities
export const STATUS_METADATA = {
    present: {
        label: 'Present',
        description: 'Student attended the class on time.',
        color: 'emerald',
        affectsPayout: true,
        positive: true
    },
    late: {
        label: 'Late',
        description: 'Student arrived after the scheduled start but still participated.',
        color: 'yellow',
        affectsPayout: true,
        neutral: true
    },
    absent_excused: {
        label: 'Absent (Excused)',
        description: 'Student was absent but provided an approved reason beforehand.',
        color: 'blue',
        affectsPayout: false,
        neutral: true
    },
    absent_unexcused: {
        label: 'Absent (Unexcused)',
        description: 'Student did not attend and no valid reason was provided.',
        color: 'red',
        affectsPayout: false,
        negative: true
    },
    no_show: {
        label: 'No Show',
        description: 'Student booked but neither attended nor canceled in advance.',
        color: 'rose',
        affectsPayout: false,
        negative: true,
        terminal: true
    },
    canceled_by_student: {
        label: 'Canceled (Student)',
        description: 'Student canceled attendance prior to start time.',
        color: 'gray',
        affectsPayout: false,
        neutral: true
    },
    canceled_by_instructor: {
        label: 'Canceled (Instructor)',
        description: 'Class canceled by instructor. Students may receive makeup credit.',
        color: 'violet',
        affectsPayout: false,
        neutral: true
    },
    makeup_scheduled: {
        label: 'Makeup Scheduled',
        description: 'Student has a makeup class scheduled to compensate a missed session.',
        color: 'indigo',
        affectsPayout: false,
        neutral: true
    },
    makeup_completed: {
        label: 'Makeup Completed',
        description: 'Student successfully attended the scheduled makeup session.',
        color: 'teal',
        affectsPayout: true,
        positive: true
    }
};
// Suggested tailwind badge styling generator
export function getAttendanceBadgeClasses(status) {
    const meta = STATUS_METADATA[status];
    const base = 'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border';
    const color = meta.color;
    // Map semantic color token to tailwind utility variants (adjust palette if needed)
    switch (color) {
        case 'emerald':
            return `${base} bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700`;
        case 'yellow':
            return `${base} bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700`;
        case 'blue':
            return `${base} bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700`;
        case 'red':
            return `${base} bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700`;
        case 'rose':
            return `${base} bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-700`;
        case 'gray':
            return `${base} bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 border-gray-300 dark:border-slate-600`;
        case 'violet':
            return `${base} bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-700`;
        case 'indigo':
            return `${base} bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700`;
        case 'teal':
            return `${base} bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-700`;
        default:
            return `${base} bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 border-gray-300 dark:border-slate-600`;
    }
}
export function describeAttendance(status) {
    return STATUS_METADATA[status].description;
}
export function isPositiveAttendance(status) {
    return !!STATUS_METADATA[status].positive;
}
export function affectsPayout(status) {
    return STATUS_METADATA[status].affectsPayout;
}
// Derive lists
export const PAYOUT_RELEVANT_STATUSES = Object.keys(STATUS_METADATA)
    .filter(s => STATUS_METADATA[s].affectsPayout);
export const NEGATIVE_ATTENDANCE_STATUSES = Object.keys(STATUS_METADATA)
    .filter(s => STATUS_METADATA[s].negative);
export const TERMINAL_ATTENDANCE_STATUSES = Object.keys(STATUS_METADATA)
    .filter(s => STATUS_METADATA[s].terminal);
export const ATTENDANCE_OPTIONS = Object.keys(STATUS_METADATA)
    .map(s => ({
    value: s,
    label: STATUS_METADATA[s].label,
    description: STATUS_METADATA[s].description
}));
