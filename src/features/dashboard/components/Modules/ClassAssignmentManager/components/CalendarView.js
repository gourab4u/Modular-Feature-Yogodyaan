import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Calendar, ChevronLeft, ChevronRight, IndianRupee, MapPin, Trash2, User } from 'lucide-react';
import { useState } from 'react';
import { getClientNames } from '../types';
import { formatDate, formatTime, getStatusStyle } from '../utils';
import { Button } from './Button';
export const CalendarView = ({ assignments, isSelectMode, selectedAssignments, onToggleSelection, onDeleteAssignment, onOpenClassDetails }) => {
    const [currentWeek, setCurrentWeek] = useState(() => {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay()); // Start on Sunday
        return startOfWeek;
    });
    // Generate week dates
    const weekDates = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(currentWeek);
        date.setDate(currentWeek.getDate() + i);
        return date;
    });
    // Generate hours (24-hour format)
    const hours = Array.from({ length: 24 }, (_, i) => i);
    // Navigation functions
    const goToPreviousWeek = () => {
        const prevWeek = new Date(currentWeek);
        prevWeek.setDate(currentWeek.getDate() - 7);
        setCurrentWeek(prevWeek);
    };
    const goToNextWeek = () => {
        const nextWeek = new Date(currentWeek);
        nextWeek.setDate(currentWeek.getDate() + 7);
        setCurrentWeek(nextWeek);
    };
    const goToToday = () => {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        setCurrentWeek(startOfWeek);
    };
    // Filter assignments for current week
    const weekAssignments = assignments.filter(assignment => {
        const assignmentDate = new Date(assignment.date);
        return assignmentDate >= weekDates[0] && assignmentDate <= weekDates[6];
    });
    // Get assignments for a specific day and hour
    const getAssignmentsForTimeSlot = (date, hour) => {
        const dateStr = date.toISOString().split('T')[0];
        return weekAssignments.filter(assignment => {
            if (assignment.date !== dateStr)
                return false;
            if (!assignment.start_time)
                return false;
            const startHour = parseInt(assignment.start_time.split(':')[0]);
            const startMinute = parseInt(assignment.start_time.split(':')[1]);
            const endHour = assignment.end_time ? parseInt(assignment.end_time.split(':')[0]) : startHour + 1;
            const endMinute = assignment.end_time ? parseInt(assignment.end_time.split(':')[1]) : 0;
            // Check if the time slot overlaps with the assignment time
            const slotStart = hour * 60;
            const slotEnd = (hour + 1) * 60;
            const assignmentStart = startHour * 60 + startMinute;
            const assignmentEnd = endHour * 60 + endMinute;
            return slotStart < assignmentEnd && slotEnd > assignmentStart;
        });
    };
    // Calculate assignment height based on duration
    const getAssignmentHeight = (assignment) => {
        if (!assignment.start_time || !assignment.end_time)
            return 60; // Default 1 hour
        const startTime = assignment.start_time.split(':').map(Number);
        const endTime = assignment.end_time.split(':').map(Number);
        const startMinutes = startTime[0] * 60 + startTime[1];
        const endMinutes = endTime[0] * 60 + endTime[1];
        const durationMinutes = endMinutes - startMinutes;
        return Math.max(30, durationMinutes); // Minimum 30px height
    };
    // Calculate assignment position within the hour
    const getAssignmentPosition = (assignment, hour) => {
        if (!assignment.start_time)
            return 0;
        const startTime = assignment.start_time.split(':').map(Number);
        const startMinutes = startTime[0] * 60 + startTime[1];
        const hourStartMinutes = hour * 60;
        if (startMinutes < hourStartMinutes)
            return 0;
        const minutesIntoHour = startMinutes - hourStartMinutes;
        return (minutesIntoHour / 60) * 60; // Convert to pixels (60px per hour)
    };
    const today = new Date();
    const isToday = (date) => {
        return date.toDateString() === today.toDateString();
    };
    return (_jsxs("div", { className: "h-full flex flex-col", children: [_jsxs("div", { className: "flex items-center justify-between p-4 border-b border-gray-200", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsxs("h3", { className: "text-lg font-semibold text-gray-900 flex items-center", children: [_jsx(Calendar, { className: "w-5 h-5 mr-2" }), "Weekly Calendar"] }), _jsxs("div", { className: "text-sm text-gray-600", children: [weekDates[0].toLocaleDateString('en-US', { month: 'long', day: 'numeric' }), " - ", ' ', weekDates[6].toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })] })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Button, { variant: "outline", size: "sm", onClick: goToPreviousWeek, children: _jsx(ChevronLeft, { className: "w-4 h-4" }) }), _jsx(Button, { variant: "outline", size: "sm", onClick: goToToday, children: "Today" }), _jsx(Button, { variant: "outline", size: "sm", onClick: goToNextWeek, children: _jsx(ChevronRight, { className: "w-4 h-4" }) })] })] }), _jsx("div", { className: "flex-1 overflow-auto", children: _jsxs("div", { className: "min-w-full", children: [_jsxs("div", { className: "grid grid-cols-8 border-b border-gray-200 bg-gray-50", children: [_jsx("div", { className: "p-3 text-sm font-medium text-gray-500", children: "Time" }), weekDates.map((date, index) => (_jsxs("div", { className: `p-3 text-center ${isToday(date) ? 'bg-blue-50' : ''}`, children: [_jsx("div", { className: "text-sm font-medium text-gray-900", children: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][index] }), _jsx("div", { className: `text-lg font-semibold mt-1 ${isToday(date) ? 'text-blue-600' : 'text-gray-900'}`, children: date.getDate() })] }, index)))] }), _jsx("div", { className: "relative", children: hours.map(hour => (_jsxs("div", { className: "grid grid-cols-8 border-b border-gray-100 min-h-[60px]", children: [_jsx("div", { className: "p-2 text-sm text-gray-500 border-r border-gray-100 bg-gray-50", children: hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM` }), weekDates.map((date, dayIndex) => {
                                        const timeSlotAssignments = getAssignmentsForTimeSlot(date, hour);
                                        return (_jsx("div", { className: `relative border-r border-gray-100 min-h-[60px] p-1 ${isToday(date) ? 'bg-blue-25' : ''}`, children: timeSlotAssignments.map(assignment => {
                                                const statusStyle = getStatusStyle(assignment);
                                                const height = getAssignmentHeight(assignment);
                                                const position = getAssignmentPosition(assignment, hour);
                                                return (_jsx("div", { className: `absolute left-1 right-1 rounded p-1 text-xs cursor-pointer transition-all hover:shadow-md group ${statusStyle.bgColor} ${statusStyle.borderColor} border-l-2`, style: {
                                                        top: `${position}px`,
                                                        height: `${Math.min(height, 60 - position)}px`,
                                                        minHeight: '24px'
                                                    }, onClick: (e) => {
                                                        e.stopPropagation();
                                                        if (!isSelectMode) {
                                                            onOpenClassDetails(assignment);
                                                        }
                                                    }, children: _jsx("div", { className: "flex items-center justify-between h-full", children: _jsxs("div", { className: "flex-1 min-w-0", children: [isSelectMode && (_jsx("div", { className: "float-left mr-1", onClick: (e) => {
                                                                        e.stopPropagation();
                                                                        onToggleSelection(assignment.id);
                                                                    }, children: _jsx("input", { type: "checkbox", checked: selectedAssignments.has(assignment.id), onChange: () => onToggleSelection(assignment.id), className: "h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" }) })), !isSelectMode && (_jsx("button", { onClick: (e) => {
                                                                        e.stopPropagation();
                                                                        onDeleteAssignment(assignment.id, `${assignment.class_type?.name || 'Class'} on ${formatDate(assignment.date)}`);
                                                                    }, className: "opacity-0 group-hover:opacity-100 absolute top-1 right-1 p-0.5 text-red-600 hover:text-red-800 transition-all", title: "Delete assignment", children: _jsx(Trash2, { className: "w-3 h-3" }) })), _jsx("div", { className: `font-medium truncate ${statusStyle.textColor}`, children: assignment.class_type?.name || 'Class' }), _jsxs("div", { className: "text-xs opacity-75 truncate", children: [formatTime(assignment.start_time), " - ", formatTime(assignment.end_time)] }), _jsxs("div", { className: "text-xs opacity-75 truncate flex items-center", children: [_jsx(User, { className: "w-3 h-3 mr-1" }), assignment.instructor_profile?.full_name || 'Instructor'] }), _jsxs("div", { className: "text-xs opacity-75 truncate flex items-center", children: [_jsx(IndianRupee, { className: "w-3 h-3 mr-1" }), "\u20B9", assignment.payment_amount.toFixed(0)] }), getClientNames(assignment) && (_jsxs("div", { className: "text-xs opacity-75 truncate flex items-center", children: [_jsx(MapPin, { className: "w-3 h-3 mr-1" }), getClientNames(assignment)] })), _jsx("div", { className: `inline-block px-1.5 py-0.5 rounded text-xs font-medium ${statusStyle.bgColor} ${statusStyle.textColor} border ${statusStyle.borderColor}`, children: statusStyle.label })] }) }) }, assignment.id));
                                            }) }, dayIndex));
                                    })] }, hour))) })] }) }), _jsx("div", { className: "border-t border-gray-200 p-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-6", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("div", { className: "w-3 h-3 bg-green-100 border-l-2 border-green-500 rounded" }), _jsx("span", { className: "text-sm text-gray-600", children: "Accepted" })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("div", { className: "w-3 h-3 bg-yellow-100 border-l-2 border-yellow-500 rounded" }), _jsx("span", { className: "text-sm text-gray-600", children: "Pending" })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("div", { className: "w-3 h-3 bg-red-100 border-l-2 border-red-500 rounded" }), _jsx("span", { className: "text-sm text-gray-600", children: "Rejected" })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("div", { className: "w-3 h-3 bg-gray-100 border-l-2 border-gray-500 rounded" }), _jsx("span", { className: "text-sm text-gray-600", children: "Completed" })] })] }), _jsxs("div", { className: "text-sm text-gray-500", children: [weekAssignments.length, " assignment", weekAssignments.length !== 1 ? 's' : '', " this week"] })] }) })] }));
};
