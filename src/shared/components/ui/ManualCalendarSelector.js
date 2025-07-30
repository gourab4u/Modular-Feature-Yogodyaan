import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Calendar, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from './Button';
export function ManualCalendarSelector({ selections, onSelectionsChange, timezone, requiredCount, maxDate, minDate }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedStartTime, setSelectedStartTime] = useState('');
    const [selectedEndTime, setSelectedEndTime] = useState('');
    const [isSelecting, setIsSelecting] = useState(false);
    // Generate 24-hour time slots with 30-minute intervals
    const timeSlots = Array.from({ length: 48 }, (_, i) => {
        const hour = Math.floor(i / 2);
        const minute = (i % 2) * 30;
        return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    });
    // Get days in current month
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday
        const days = [];
        const currentDay = new Date(startDate);
        while (days.length < 42) { // 6 weeks
            days.push(new Date(currentDay));
            currentDay.setDate(currentDay.getDate() + 1);
        }
        return days;
    };
    const days = getDaysInMonth(currentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const formatDate = (date) => {
        return date.toISOString().split('T')[0];
    };
    const formatTimeWithAMPM = (time) => {
        const [hours, minutes] = time.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    };
    const isDateDisabled = (date) => {
        const dateStr = formatDate(date);
        if (minDate && dateStr < minDate)
            return true;
        if (maxDate && dateStr > maxDate)
            return true;
        if (date < today)
            return true;
        return false;
    };
    const isDateSelected = (date) => {
        const dateStr = formatDate(date);
        return selections.some(selection => selection.date === dateStr);
    };
    const getSelectionCountForDate = (date) => {
        const dateStr = formatDate(date);
        return selections.filter(selection => selection.date === dateStr).length;
    };
    const handleDateClick = (date) => {
        if (isDateDisabled(date))
            return;
        const dateStr = formatDate(date);
        setSelectedDate(dateStr);
        setIsSelecting(true);
        setSelectedStartTime('');
        setSelectedEndTime('');
    };
    const handleAddSelection = () => {
        if (!selectedDate || !selectedStartTime || !selectedEndTime)
            return;
        const newSelection = {
            date: selectedDate,
            start_time: selectedStartTime,
            end_time: selectedEndTime,
            timezone
        };
        const updatedSelections = [...selections, newSelection];
        onSelectionsChange(updatedSelections);
        // Reset form
        setIsSelecting(false);
        setSelectedDate('');
        setSelectedStartTime('');
        setSelectedEndTime('');
    };
    const handleRemoveSelection = (index) => {
        const updatedSelections = selections.filter((_, i) => i !== index);
        onSelectionsChange(updatedSelections);
    };
    const navigateMonth = (direction) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
        setCurrentDate(newDate);
    };
    const isTimeSlotValid = () => {
        if (!selectedStartTime || !selectedEndTime)
            return false;
        return selectedStartTime < selectedEndTime;
    };
    const getTimeConflicts = () => {
        if (!selectedDate || !selectedStartTime || !selectedEndTime)
            return [];
        return selections.filter(selection => {
            if (selection.date !== selectedDate)
                return false;
            const newStart = new Date(`2000-01-01T${selectedStartTime}`);
            const newEnd = new Date(`2000-01-01T${selectedEndTime}`);
            const existingStart = new Date(`2000-01-01T${selection.start_time}`);
            const existingEnd = new Date(`2000-01-01T${selection.end_time}`);
            return (newStart < existingEnd && newEnd > existingStart);
        });
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Calendar, { className: "w-5 h-5 text-blue-600 dark:text-blue-400" }), _jsx("span", { className: "font-medium text-blue-900 dark:text-blue-100", children: "Manual Class Selection" })] }), _jsxs("div", { className: "text-sm font-medium text-blue-700 dark:text-blue-300", children: [selections.length, " / ", requiredCount, " classes selected"] })] }), selections.length !== requiredCount && (_jsx("p", { className: "text-sm text-blue-600 dark:text-blue-400 mt-2", children: selections.length < requiredCount
                            ? `Please select ${requiredCount - selections.length} more class${requiredCount - selections.length !== 1 ? 'es' : ''}`
                            : `Please remove ${selections.length - requiredCount} selection${selections.length - requiredCount !== 1 ? 's' : ''}` }))] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-gray-100", children: "Select Dates" }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Button, { variant: "outline", size: "sm", onClick: () => navigateMonth('prev'), children: "\u2039" }), _jsx("span", { className: "text-sm font-medium px-3", children: currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => navigateMonth('next'), children: "\u203A" })] })] }), _jsxs("div", { className: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4", children: [_jsx("div", { className: "grid grid-cols-7 gap-1 mb-2", children: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (_jsx("div", { className: "text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2", children: day }, day))) }), _jsx("div", { className: "grid grid-cols-7 gap-1", children: days.map((day, index) => {
                                            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                                            const isToday = day.toDateString() === new Date().toDateString();
                                            const isDisabled = isDateDisabled(day);
                                            const isSelected = isDateSelected(day);
                                            const selectionCount = getSelectionCountForDate(day);
                                            return (_jsxs("button", { onClick: () => handleDateClick(day), disabled: isDisabled, className: `
                      relative h-10 text-sm rounded-md transition-colors
                      ${!isCurrentMonth ? 'text-gray-300 dark:text-gray-600' : ''}
                      ${isToday ? 'ring-2 ring-blue-500' : ''}
                      ${isDisabled
                                                    ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                                                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer'}
                      ${isSelected
                                                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 font-medium'
                                                    : 'text-gray-900 dark:text-gray-100'}
                    `, children: [day.getDate(), selectionCount > 0 && (_jsx("div", { className: "absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center", children: selectionCount }))] }, index));
                                        }) })] })] }), _jsxs("div", { className: "space-y-4", children: [isSelecting && (_jsxs("div", { className: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4", children: [_jsxs("h4", { className: "font-medium text-gray-900 dark:text-gray-100 mb-3", children: ["Add Class for ", selectedDate] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Start Time" }), _jsxs("select", { value: selectedStartTime, onChange: (e) => setSelectedStartTime(e.target.value), className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100", children: [_jsx("option", { value: "", children: "Select start time" }), timeSlots.map(time => (_jsx("option", { value: time, children: formatTimeWithAMPM(time) }, time)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "End Time" }), _jsxs("select", { value: selectedEndTime, onChange: (e) => setSelectedEndTime(e.target.value), className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100", children: [_jsx("option", { value: "", children: "Select end time" }), timeSlots.map(time => (_jsx("option", { value: time, children: formatTimeWithAMPM(time) }, time)))] })] })] }), getTimeConflicts().length > 0 && (_jsx("div", { className: "text-sm text-red-600 dark:text-red-400", children: "Time conflict with existing selection(s)" })), _jsxs("div", { className: "flex space-x-2", children: [_jsxs(Button, { onClick: handleAddSelection, disabled: !isTimeSlotValid() || getTimeConflicts().length > 0, size: "sm", children: [_jsx(Plus, { className: "w-4 h-4 mr-1" }), "Add Class"] }), _jsx(Button, { variant: "outline", onClick: () => setIsSelecting(false), size: "sm", children: "Cancel" })] })] })] })), _jsxs("div", { className: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg", children: [_jsx("div", { className: "p-4 border-b border-gray-200 dark:border-gray-700", children: _jsxs("h4", { className: "font-medium text-gray-900 dark:text-gray-100", children: ["Selected Classes (", selections.length, ")"] }) }), _jsx("div", { className: "max-h-64 overflow-y-auto", children: selections.length === 0 ? (_jsx("div", { className: "p-4 text-center text-gray-500 dark:text-gray-400", children: "No classes selected yet" })) : (_jsx("div", { className: "divide-y divide-gray-200 dark:divide-gray-700", children: selections.map((selection, index) => (_jsxs("div", { className: "p-3 flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("div", { className: "font-medium text-gray-900 dark:text-gray-100", children: new Date(selection.date).toLocaleDateString('en-US', {
                                                                    weekday: 'short',
                                                                    month: 'short',
                                                                    day: 'numeric'
                                                                }) }), _jsxs("div", { className: "text-sm text-gray-500 dark:text-gray-400", children: [formatTimeWithAMPM(selection.start_time), " - ", formatTimeWithAMPM(selection.end_time)] })] }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => handleRemoveSelection(index), className: "text-red-600 hover:text-red-700", children: _jsx(X, { className: "w-4 h-4" }) })] }, index))) })) })] })] })] })] }));
}
