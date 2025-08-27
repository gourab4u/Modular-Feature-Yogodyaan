import { FormData } from '../types'

interface AssignmentTypeSelectorProps {
    formData: FormData
    onInputChange: (field: string, value: any) => void
    errors: Record<string, string>
}

export const AssignmentTypeSelector = ({ formData, onInputChange, errors }: AssignmentTypeSelectorProps) => {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Assignment Type</label>
            <select
                value={formData.assignment_type}
                onChange={(e) => onInputChange('assignment_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                <option value="adhoc">Single Class (Ad-hoc)</option>
                <option value="weekly">Weekly Classes</option>
                <option value="monthly">Monthly Package</option>
                <option value="crash_course">Crash Course</option>
                <option value="package">Regular Package</option>
            </select>
            {errors.assignment_type && (
                <p className="text-red-500 text-sm mt-1">{errors.assignment_type}</p>
            )}
        </div>
    )
}