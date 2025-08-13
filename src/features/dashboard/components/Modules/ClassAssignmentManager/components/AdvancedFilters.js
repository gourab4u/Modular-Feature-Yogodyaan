import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Calendar, Filter, X } from 'lucide-react';
import { Button } from './Button';
export const AdvancedFilters = ({ isVisible, filters, classTypes, instructors, packages, onFiltersChange, onClose, onClearAll }) => {
    if (!isVisible)
        return null;
    const handleFilterChange = (key, value) => {
        onFiltersChange({
            ...filters,
            [key]: value
        });
    };
    const handleArrayFilterToggle = (key, value) => {
        const currentArray = filters[key];
        const updatedArray = currentArray.includes(value)
            ? currentArray.filter(item => item !== value)
            : [...currentArray, value];
        handleFilterChange(key, updatedArray);
    };
    const activeFiltersCount = Object.entries(filters).reduce((count, [key, value]) => {
        if (key === 'dateRange') {
            const dateRange = value;
            return count + (dateRange.start ? 1 : 0) + (dateRange.end ? 1 : 0);
        }
        if (Array.isArray(value)) {
            return count + value.length;
        }
        if (typeof value === 'string' && value) {
            return count + 1;
        }
        if (typeof value === 'boolean' && value) {
            return count + 1;
        }
        return count;
    }, 0);
    return (_jsx("div", { className: "fixed inset-0 z-50 overflow-y-auto", children: _jsxs("div", { className: "flex min-h-full items-center justify-center p-4", children: [_jsx("div", { className: "fixed inset-0 bg-gray-500 bg-opacity-75", onClick: onClose }), _jsxs("div", { className: "relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto", children: [_jsx("div", { className: "px-6 py-4 border-b border-gray-200", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("h2", { className: "text-xl font-semibold text-gray-900 flex items-center", children: [_jsx(Filter, { className: "w-5 h-5 mr-2" }), "Advanced Filters", activeFiltersCount > 0 && (_jsxs("span", { className: "ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full", children: [activeFiltersCount, " active"] }))] }), _jsx("button", { type: "button", onClick: onClose, className: "text-gray-400 hover:text-gray-600", children: _jsx(X, { className: "w-6 h-6" }) })] }) }), _jsxs("div", { className: "px-6 py-4 space-y-6", children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-3", children: [_jsx(Calendar, { className: "w-4 h-4 inline mr-1" }), "Date Range"] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-xs text-gray-500 mb-1", children: "Start Date" }), _jsx("input", { type: "date", value: filters.dateRange.start, onChange: (e) => handleFilterChange('dateRange', {
                                                                ...filters.dateRange,
                                                                start: e.target.value
                                                            }), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs text-gray-500 mb-1", children: "End Date" }), _jsx("input", { type: "date", value: filters.dateRange.end, onChange: (e) => handleFilterChange('dateRange', {
                                                                ...filters.dateRange,
                                                                end: e.target.value
                                                            }), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" })] })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-3", children: "Assignment Types" }), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-5 gap-3", children: [
                                                { value: 'adhoc', label: 'Ad-hoc' },
                                                { value: 'weekly', label: 'Weekly' },
                                                { value: 'monthly', label: 'Monthly' },
                                                { value: 'crash_course', label: 'Crash Course' },
                                                { value: 'package', label: 'Package' }
                                            ].map(type => (_jsxs("label", { className: "flex items-center", children: [_jsx("input", { type: "checkbox", checked: filters.assignmentTypes.includes(type.value), onChange: () => handleArrayFilterToggle('assignmentTypes', type.value), className: "h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" }), _jsx("span", { className: "ml-2 text-sm text-gray-700", children: type.label })] }, type.value))) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-3", children: "Class Status" }), _jsx("div", { className: "grid grid-cols-3 gap-3", children: [
                                                { value: 'scheduled', label: 'Scheduled' },
                                                { value: 'completed', label: 'Completed' },
                                                { value: 'cancelled', label: 'Cancelled' }
                                            ].map(status => (_jsxs("label", { className: "flex items-center", children: [_jsx("input", { type: "checkbox", checked: filters.classStatus.includes(status.value), onChange: () => handleArrayFilterToggle('classStatus', status.value), className: "h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" }), _jsx("span", { className: "ml-2 text-sm text-gray-700", children: status.label })] }, status.value))) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-3", children: "Payment Status" }), _jsx("div", { className: "grid grid-cols-3 gap-3", children: [
                                                { value: 'pending', label: 'Pending' },
                                                { value: 'paid', label: 'Paid' },
                                                { value: 'cancelled', label: 'Cancelled' }
                                            ].map(status => (_jsxs("label", { className: "flex items-center", children: [_jsx("input", { type: "checkbox", checked: filters.paymentStatus.includes(status.value), onChange: () => handleArrayFilterToggle('paymentStatus', status.value), className: "h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" }), _jsx("span", { className: "ml-2 text-sm text-gray-700", children: status.label })] }, status.value))) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-3", children: "Instructors" }), _jsx("div", { className: "max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3", children: instructors.map(instructor => (_jsxs("label", { className: "flex items-center py-1", children: [_jsx("input", { type: "checkbox", checked: filters.instructors.includes(instructor.user_id), onChange: () => handleArrayFilterToggle('instructors', instructor.user_id), className: "h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" }), _jsx("span", { className: "ml-2 text-sm text-gray-700", children: instructor.full_name })] }, instructor.user_id))) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-3", children: "Class Types" }), _jsx("div", { className: "max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3", children: classTypes.map(classType => (_jsxs("label", { className: "flex items-center py-1", children: [_jsx("input", { type: "checkbox", checked: filters.classTypes.includes(classType.id), onChange: () => handleArrayFilterToggle('classTypes', classType.id), className: "h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" }), _jsxs("span", { className: "ml-2 text-sm text-gray-700", children: [classType.name, " (", classType.difficulty_level, ")"] })] }, classType.id))) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-3", children: "Packages" }), _jsx("div", { className: "max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3", children: packages.map(pkg => (_jsxs("label", { className: "flex items-center py-1", children: [_jsx("input", { type: "checkbox", checked: filters.packages.includes(pkg.id), onChange: () => handleArrayFilterToggle('packages', pkg.id), className: "h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" }), _jsxs("span", { className: "ml-2 text-sm text-gray-700", children: [pkg.name, " (", pkg.class_count, " classes)"] })] }, pkg.id))) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Client Name" }), _jsx("input", { type: "text", value: filters.clientName, onChange: (e) => handleFilterChange('clientName', e.target.value), placeholder: "Search by client name...", className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsx("div", { children: _jsxs("label", { className: "flex items-center", children: [_jsx("input", { type: "checkbox", checked: filters.weeklyClasses, onChange: (e) => handleFilterChange('weeklyClasses', e.target.checked), className: "h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" }), _jsx("span", { className: "ml-2 text-sm font-medium text-gray-700", children: "Show only weekly recurring classes" })] }) })] }), _jsxs("div", { className: "px-6 py-4 border-t border-gray-200 flex justify-between items-center", children: [_jsx("div", { className: "text-sm text-gray-500", children: activeFiltersCount > 0 && (_jsxs("span", { children: [activeFiltersCount, " filter", activeFiltersCount !== 1 ? 's' : '', " active"] })) }), _jsxs("div", { className: "flex space-x-3", children: [_jsx(Button, { variant: "outline", onClick: onClearAll, children: "Clear All" }), _jsx(Button, { onClick: onClose, children: "Apply Filters" })] })] })] })] }) }));
};
