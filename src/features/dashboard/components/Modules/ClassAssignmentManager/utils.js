export const calculateCourseEndDate = (startDate, duration, unit) => {
    const start = new Date(startDate);
    const end = new Date(start);
    if (unit === 'weeks') {
        end.setDate(start.getDate() + (duration * 7));
    }
    else if (unit === 'months') {
        end.setMonth(start.getMonth() + duration);
    }
    return end.toISOString().split('T')[0];
};
export const calculateWeeklyClasses = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const weeks = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7));
    return Math.max(1, weeks);
};
export const calculateCourseClasses = (duration, unit, frequency) => {
    const totalWeeks = unit === 'weeks' ? duration : duration * 4; // Approximate weeks
    switch (frequency) {
        case 'daily':
            return totalWeeks * 7;
        case 'weekly':
            return totalWeeks;
        default:
            return totalWeeks; // Default to weekly
    }
};
export const getDayName = (dayOfWeek) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek];
};
export const getOrdinalSuffix = (day) => {
    if (day > 3 && day < 21)
        return 'th';
    switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
    }
};
export const timeToMinutes = (timeString) => {
    if (!timeString || !timeString.includes(':'))
        return 0;
    const [hours, minutes] = timeString.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes))
        return 0;
    return Math.max(0, Math.min(24 * 60, hours * 60 + minutes));
};
export const minutesToTime = (minutes) => {
    const clampedMinutes = Math.max(0, Math.min(24 * 60 - 1, minutes));
    const hours = Math.floor(clampedMinutes / 60);
    const mins = clampedMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};
export const getDurationOptions = () => [
    { value: 30, label: '30 minutes' },
    { value: 60, label: '1 hour' },
    { value: 90, label: '1 hour 30 minutes' },
    { value: 120, label: '2 hours' }
];
export const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    }
    else if (date.toDateString() === tomorrow.toDateString()) {
        return 'Tomorrow';
    }
    else {
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    }
};
export const formatTime = (timeString) => {
    // Handle null or undefined timeString
    if (!timeString) {
        return '—';
    }
    // Handle empty string
    if (timeString.trim() === '') {
        return '—';
    }
    try {
        const [hours, minutes] = timeString.split(':').map(Number);
        // Validate that we got valid numbers
        if (isNaN(hours) || isNaN(minutes)) {
            return '—';
        }
        const date = new Date();
        date.setHours(hours, minutes);
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }
    catch (error) {
        console.error('Error formatting time:', timeString, error);
        return '—';
    }
};
export const getAssignmentType = (assignment) => {
    // Handle package assignments by class_package_id
    if (assignment.class_package_id) {
        return 'package';
    }
    // Handle missing schedule_type
    if (!assignment.schedule_type) {
        return 'adhoc';
    }
    switch (assignment.schedule_type) {
        case 'monthly':
            return 'monthly';
        case 'crash':
            return 'crash_course';
        case 'weekly':
            return 'weekly';
        case 'adhoc':
        default:
            return 'adhoc';
    }
};
export const getClassStatus = (assignment) => {
    // For cancelled classes, always return cancelled
    if (assignment.class_status === 'cancelled') {
        return 'cancelled';
    }
    // For completed classes, always return completed
    if (assignment.class_status === 'completed') {
        return 'completed';
    }
    // For active classes, use instructor status as primary indicator
    switch (assignment.instructor_status) {
        case 'accepted':
            return 'accepted';
        case 'rejected':
            return 'rejected';
        case 'pending':
        default:
            return 'pending';
    }
};
export const getStatusStyle = (assignment) => {
    const status = getClassStatus(assignment);
    switch (status) {
        case 'accepted':
            return {
                bgColor: 'bg-green-100',
                borderColor: 'border-green-500',
                textColor: 'text-green-800',
                label: 'Accepted'
            };
        case 'rejected':
            return {
                bgColor: 'bg-red-100',
                borderColor: 'border-red-500',
                textColor: 'text-red-800',
                label: 'Rejected'
            };
        case 'completed':
            return {
                bgColor: 'bg-gray-100',
                borderColor: 'border-gray-500',
                textColor: 'text-gray-800',
                label: 'Completed'
            };
        case 'cancelled':
            return {
                bgColor: 'bg-gray-100',
                borderColor: 'border-gray-400',
                textColor: 'text-gray-600',
                label: 'Cancelled'
            };
        case 'pending':
        default:
            return {
                bgColor: 'bg-yellow-100',
                borderColor: 'border-yellow-500',
                textColor: 'text-yellow-800',
                label: 'Pending'
            };
    }
};
