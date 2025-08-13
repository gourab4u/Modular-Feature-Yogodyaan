import React from 'react';
import { getAttendanceBadgeClasses, STATUS_METADATA } from '../../../shared/constants/attendanceStatus';
import { AttendanceStatus } from '../../../shared/types/attendance';

interface AttendanceStatusBadgeProps {
    status: AttendanceStatus;
    className?: string;
    showLabel?: boolean;
    compact?: boolean;
    tooltip?: boolean; // if you have a tooltip system you can wire up later
}

/**
 * Renders a colored badge for a given attendance status using STATUS_METADATA styling helper.
 */
export const AttendanceStatusBadge: React.FC<AttendanceStatusBadgeProps> = ({
    status,
    className = '',
    showLabel = true,
    compact = false
}) => {
    const meta = STATUS_METADATA[status];
    const classes = getAttendanceBadgeClasses(status);

    return (
        <span
            className={`${classes} ${compact ? 'px-1 py-0.5' : ''} ${className}`}
            title={meta.description}
            data-status={status}
        >
            {showLabel ? meta.label : status}
        </span>
    );
};
