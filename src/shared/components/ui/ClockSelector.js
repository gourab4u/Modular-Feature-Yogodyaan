import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { Clock } from 'lucide-react';
export default function ClockSelector({ value, onChange, label, error }) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedHour, setSelectedHour] = useState(12);
    const [selectedMinute, setSelectedMinute] = useState(0);
    const [period, setPeriod] = useState('AM');
    const containerRef = useRef(null);
    // Parse initial value
    useEffect(() => {
        if (value) {
            const [hours, minutes] = value.split(':').map(Number);
            const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
            setSelectedHour(hour12);
            setSelectedMinute(minutes);
            setPeriod(hours >= 12 ? 'PM' : 'AM');
        }
    }, [value]);
    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    const formatTime = (hour, minute, period) => {
        const hour24 = period === 'AM' ? (hour === 12 ? 0 : hour) : (hour === 12 ? 12 : hour + 12);
        return `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    };
    const formatDisplayTime = (hour, minute, period) => {
        return `${hour}:${minute.toString().padStart(2, '0')} ${period}`;
    };
    // Modified function - removed setIsOpen(false) to keep popup open
    const handleTimeSelect = (hour, minute, newPeriod) => {
        setSelectedHour(hour);
        setSelectedMinute(minute);
        setPeriod(newPeriod);
        // Removed the auto-close behavior
        // setIsOpen(false); // <-- This was causing the issue
    };
    const hours = Array.from({ length: 12 }, (_, i) => i + 1);
    const minutes = Array.from({ length: 12 }, (_, i) => i * 5);
    return (_jsxs("div", { className: "relative", ref: containerRef, children: [label && (_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: [_jsx(Clock, { className: "w-4 h-4 inline mr-1" }), label] })), _jsxs("div", { className: "relative", children: [_jsxs("button", { type: "button", onClick: () => setIsOpen(!isOpen), className: `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left bg-white ${error ? 'border-red-500' : 'border-gray-300'}`, children: [value ? formatDisplayTime(selectedHour, selectedMinute, period) : 'Select time', _jsx(Clock, { className: "w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" })] }), isOpen && (_jsx("div", { className: "absolute z-50 mt-1 w-80 bg-white border border-gray-300 rounded-lg shadow-lg", children: _jsxs("div", { className: "p-4", children: [_jsx("div", { className: "flex justify-center mb-4", children: _jsx("div", { className: "bg-blue-50 rounded-lg p-4 text-center", children: _jsx("div", { className: "text-2xl font-bold text-blue-600", children: formatDisplayTime(selectedHour, selectedMinute, period) }) }) }), _jsxs("div", { className: "grid grid-cols-3 gap-4", children: [_jsxs("div", { children: [_jsx("h4", { className: "text-sm font-medium text-gray-700 mb-2 text-center", children: "Hour" }), _jsx("div", { className: "grid grid-cols-3 gap-1 max-h-32 overflow-y-auto", children: hours.map(hour => (_jsx("button", { type: "button", onClick: () => handleTimeSelect(hour, selectedMinute, period), className: `p-2 text-sm rounded hover:bg-blue-50 ${selectedHour === hour ? 'bg-blue-500 text-white' : 'text-gray-700'}`, children: hour }, hour))) })] }), _jsxs("div", { children: [_jsx("h4", { className: "text-sm font-medium text-gray-700 mb-2 text-center", children: "Minute" }), _jsx("div", { className: "grid grid-cols-2 gap-1 max-h-32 overflow-y-auto", children: minutes.map(minute => (_jsx("button", { type: "button", onClick: () => handleTimeSelect(selectedHour, minute, period), className: `p-2 text-sm rounded hover:bg-blue-50 ${selectedMinute === minute ? 'bg-blue-500 text-white' : 'text-gray-700'}`, children: minute.toString().padStart(2, '0') }, minute))) })] }), _jsxs("div", { children: [_jsx("h4", { className: "text-sm font-medium text-gray-700 mb-2 text-center", children: "Period" }), _jsx("div", { className: "space-y-1", children: ['AM', 'PM'].map(p => (_jsx("button", { type: "button", onClick: () => handleTimeSelect(selectedHour, selectedMinute, p), className: `w-full p-2 text-sm rounded hover:bg-blue-50 ${period === p ? 'bg-blue-500 text-white' : 'text-gray-700'}`, children: p }, p))) })] })] }), _jsxs("div", { className: "mt-4 flex justify-end space-x-2", children: [_jsx("button", { type: "button", onClick: () => setIsOpen(false), className: "px-3 py-1 text-sm text-gray-600 hover:text-gray-800", children: "Cancel" }), _jsx("button", { type: "button", onClick: () => {
                                                const timeString = formatTime(selectedHour, selectedMinute, period);
                                                onChange(timeString);
                                                setIsOpen(false);
                                            }, className: "px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600", children: "Select" })] })] }) }))] }), error && _jsx("p", { className: "text-red-500 text-sm mt-1", children: error }), value && (_jsxs("p", { className: "text-sm text-gray-600 mt-1", children: ["Selected: ", formatDisplayTime(selectedHour, selectedMinute, period)] }))] }));
}
