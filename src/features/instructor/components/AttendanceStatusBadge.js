import { jsx as _jsx } from "react/jsx-runtime";
import { getAttendanceBadgeClasses, STATUS_METADATA } from '../../../shared/constants/attendanceStatus';
/**
 * Renders a colored badge for a given attendance status using STATUS_METADATA styling helper.
 */
export const AttendanceStatusBadge = ({ status, className = '', showLabel = true, compact = false }) => {
    const meta = STATUS_METADATA[status];
    const classes = getAttendanceBadgeClasses(status);
    return (_jsx("span", { className: `${classes} ${compact ? 'px-1 py-0.5' : ''} ${className}`, title: meta.description, "data-status": status, children: showLabel ? meta.label : status }));
};
