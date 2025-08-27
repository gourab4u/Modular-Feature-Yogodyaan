import { Calendar, Filter, X } from 'lucide-react'
import { Filters, ClassType, UserProfile, Package } from '../types'
import { Button } from './Button'

interface AdvancedFiltersProps {
    isVisible: boolean
    filters: Filters
    classTypes: ClassType[]
    instructors: UserProfile[]
    packages: Package[]
    onFiltersChange: (filters: Filters) => void
    onClose: () => void
    onClearAll: () => void
}

export const AdvancedFilters = ({
    isVisible,
    filters,
    classTypes,
    instructors,
    packages,
    onFiltersChange,
    onClose,
    onClearAll
}: AdvancedFiltersProps) => {
    if (!isVisible) return null

    const handleFilterChange = (key: keyof Filters, value: any) => {
        onFiltersChange({
            ...filters,
            [key]: value
        })
    }

    const handleArrayFilterToggle = (key: keyof Filters, value: string) => {
        const currentArray = filters[key] as string[]
        const updatedArray = currentArray.includes(value)
            ? currentArray.filter(item => item !== value)
            : [...currentArray, value]
        
        handleFilterChange(key, updatedArray)
    }

    const activeFiltersCount = Object.entries(filters).reduce((count, [key, value]) => {
        if (key === 'dateRange') {
            const dateRange = value as { start: string; end: string }
            return count + (dateRange.start ? 1 : 0) + (dateRange.end ? 1 : 0)
        }
        if (Array.isArray(value)) {
            return count + value.length
        }
        if (typeof value === 'string' && value) {
            return count + 1
        }
        if (typeof value === 'boolean' && value) {
            return count + 1
        }
        return count
    }, 0)

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
                <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                                <Filter className="w-5 h-5 mr-2" />
                                Advanced Filters
                                {activeFiltersCount > 0 && (
                                    <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                        {activeFiltersCount} active
                                    </span>
                                )}
                            </h2>
                            <button
                                type="button"
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    <div className="px-6 py-4 space-y-6">
                        {/* Date Range Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                <Calendar className="w-4 h-4 inline mr-1" />
                                Date Range
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        value={filters.dateRange.start}
                                        onChange={(e) => handleFilterChange('dateRange', {
                                            ...filters.dateRange,
                                            start: e.target.value
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">End Date</label>
                                    <input
                                        type="date"
                                        value={filters.dateRange.end}
                                        onChange={(e) => handleFilterChange('dateRange', {
                                            ...filters.dateRange,
                                            end: e.target.value
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Assignment Types Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">Assignment Types</label>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                {[
                                    { value: 'adhoc', label: 'Ad-hoc' },
                                    { value: 'weekly', label: 'Weekly' },
                                    { value: 'monthly', label: 'Monthly' },
                                    { value: 'crash_course', label: 'Crash Course' },
                                    { value: 'package', label: 'Package' }
                                ].map(type => (
                                    <label key={type.value} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={filters.assignmentTypes.includes(type.value)}
                                            onChange={() => handleArrayFilterToggle('assignmentTypes', type.value)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">{type.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Class Status Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">Class Status</label>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { value: 'scheduled', label: 'Scheduled' },
                                    { value: 'completed', label: 'Completed' },
                                    { value: 'cancelled', label: 'Cancelled' }
                                ].map(status => (
                                    <label key={status.value} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={filters.classStatus.includes(status.value)}
                                            onChange={() => handleArrayFilterToggle('classStatus', status.value)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">{status.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Payment Status Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">Payment Status</label>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { value: 'pending', label: 'Pending' },
                                    { value: 'paid', label: 'Paid' },
                                    { value: 'cancelled', label: 'Cancelled' }
                                ].map(status => (
                                    <label key={status.value} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={filters.paymentStatus.includes(status.value)}
                                            onChange={() => handleArrayFilterToggle('paymentStatus', status.value)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">{status.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Instructors Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">Instructors</label>
                            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3">
                                {instructors.map(instructor => (
                                    <label key={instructor.user_id} className="flex items-center py-1">
                                        <input
                                            type="checkbox"
                                            checked={filters.instructors.includes(instructor.user_id)}
                                            onChange={() => handleArrayFilterToggle('instructors', instructor.user_id)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">
                                            {instructor.full_name}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Class Types Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">Class Types</label>
                            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3">
                                {classTypes.map(classType => (
                                    <label key={classType.id} className="flex items-center py-1">
                                        <input
                                            type="checkbox"
                                            checked={filters.classTypes.includes(classType.id)}
                                            onChange={() => handleArrayFilterToggle('classTypes', classType.id)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">
                                            {classType.name} ({classType.difficulty_level})
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Packages Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">Packages</label>
                            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3">
                                {packages.map(pkg => (
                                    <label key={pkg.id} className="flex items-center py-1">
                                        <input
                                            type="checkbox"
                                            checked={filters.packages.includes(pkg.id)}
                                            onChange={() => handleArrayFilterToggle('packages', pkg.id)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">
                                            {pkg.name} ({pkg.class_count} classes)
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Client Name Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Client Name</label>
                            <input
                                type="text"
                                value={filters.clientName}
                                onChange={(e) => handleFilterChange('clientName', e.target.value)}
                                placeholder="Search by client name..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Weekly Classes Toggle */}
                        <div>
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={filters.weeklyClasses}
                                    onChange={(e) => handleFilterChange('weeklyClasses', e.target.checked)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm font-medium text-gray-700">
                                    Show only weekly recurring classes
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                            {activeFiltersCount > 0 && (
                                <span>{activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} active</span>
                            )}
                        </div>
                        <div className="flex space-x-3">
                            <Button variant="outline" onClick={onClearAll}>
                                Clear All
                            </Button>
                            <Button onClick={onClose}>
                                Apply Filters
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}