import { useState, useEffect } from 'react'
import { FormData, ValidationErrors, ConflictDetails } from '../types'
import { timeToMinutes, minutesToTime, calculateCourseEndDate, calculateWeeklyClasses, calculateCourseClasses } from '../utils'

const initialFormData: FormData = {
    // Assignment type selection
    assignment_type: 'adhoc',

    // Basic fields
    class_type_id: '',
    instructor_id: '',
    payment_amount: 0,
    payment_type: 'per_class',
    notes: '',

    // Date/Time fields (varies by type)
    date: '',
    start_time: '',
    end_time: '',
    duration: 60,

    // Course fields
    start_date: '',
    end_date: '',
    day_of_week: 0,
    day_of_month: 1,

    // Course duration
    course_duration_value: 1,
    course_duration_unit: 'weeks',
    class_frequency: 'weekly',
    specific_days: [],

    // Package fields
    package_id: '',
    booking_type: 'individual',

    // Generated/calculated fields
    timeline_description: '',
    total_classes: 1,

    // New timezone support
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,

    // New assignment method fields
    monthly_assignment_method: 'weekly_recurrence',

    // Weekly recurrence fields
    weekly_days: [],

    // Manual calendar selections
    manual_selections: [],

    // Booking reference fields
    booking_id: '',
    client_name: '',
    client_email: '',
    
    // Multiple booking support
    booking_ids: [],

    // Weekly template assignment
    selected_template_id: '',
    
    // Package validity constraint
    validity_end_date: ''
}

export const useFormHandler = (
    conflictCheckCallback?: (formData: FormData) => void,
    packages?: Array<{
        id: string
        name: string
        class_count?: number
        validity_days?: number
        [key: string]: any
    }>
) => {
    const [formData, setFormData] = useState<FormData>(initialFormData)
    const [errors, setErrors] = useState<ValidationErrors>({})
    const [conflictWarning, setConflictWarning] = useState<ConflictDetails | null>(null)

    // Auto-calculate end dates and timeline descriptions when relevant fields change
    useEffect(() => {
        updateTimelineInfo()
    }, [formData.assignment_type, formData.start_date, formData.course_duration_value, formData.course_duration_unit, formData.day_of_week, formData.day_of_month, formData.date])

    // Reset payment_type to per_class if switching away from weekly and weekly-specific payment types were selected
    useEffect(() => {
        if (formData.assignment_type !== 'weekly' && (formData.payment_type === 'monthly' || formData.payment_type === 'per_member')) {
            handleInputChange('payment_type', 'per_class')
        }
    }, [formData.assignment_type])

    const updateTimelineInfo = () => {
        let description = ''
        let calculatedEndDate = ''
        let totalClasses = 0

        switch (formData.assignment_type) {
            case 'weekly':
                if (formData.start_date) {
                    // Use end_date if provided, otherwise default to end of current year
                    calculatedEndDate = formData.end_date || `${new Date().getFullYear()}-12-31`
                    totalClasses = calculateWeeklyClasses(formData.start_date, calculatedEndDate)
                    
                    if (formData.monthly_assignment_method === 'weekly_recurrence') {
                        // Template assignment mode
                        description = `Weekly class assignment using existing template until ${new Date(calculatedEndDate).toLocaleDateString()} (${totalClasses} classes)`
                    } else {
                        // New recurring schedule mode
                        description = `Weekly classes until ${new Date(calculatedEndDate).toLocaleDateString()} (${totalClasses} classes)`
                    }
                } else {
                    description = 'Weekly class assignment - please set start date'
                    totalClasses = 1
                }
                break

            case 'monthly':
                if (formData.start_date) {
                    // Try to get package data if package_id is selected
                    const selectedPackage = packages?.find(p => p.id === formData.package_id)
                    
                    if (selectedPackage?.class_count && selectedPackage?.validity_days) {
                        // Use package data for accurate calculation
                        totalClasses = selectedPackage.class_count
                        const validityEndDate = new Date(formData.start_date)
                        validityEndDate.setDate(validityEndDate.getDate() + selectedPackage.validity_days)
                        calculatedEndDate = validityEndDate.toISOString().split('T')[0]
                        description = `Monthly package: ${selectedPackage.name} (${totalClasses} classes within ${selectedPackage.validity_days} days)`
                    } else if (formData.course_duration_value && formData.course_duration_unit) {
                        // Fallback to duration-based calculation
                        calculatedEndDate = calculateCourseEndDate(formData.start_date, formData.course_duration_value, formData.course_duration_unit)
                        
                        if (formData.monthly_assignment_method === 'weekly_recurrence' && formData.weekly_days.length > 0) {
                            // Calculate based on weekly recurrence: weeks × days per week
                            const totalWeeks = formData.course_duration_unit === 'months' 
                                ? formData.course_duration_value * 4 // Approximate 4 weeks per month
                                : formData.course_duration_value // Already in weeks
                            totalClasses = Math.ceil(totalWeeks * formData.weekly_days.length)
                        } else {
                            // Default calculation for manual calendar method
                            totalClasses = Math.ceil(formData.course_duration_value * (formData.course_duration_unit === 'months' ? 4 : 1))
                        }
                        
                        description = `Monthly classes for ${formData.course_duration_value} ${formData.course_duration_unit} (${totalClasses} classes)`
                    }
                }
                break

            case 'crash_course':
                if (formData.start_date) {
                    // Try to get package data if package_id is selected
                    const selectedPackage = packages?.find(p => p.id === formData.package_id)
                    
                    if (selectedPackage?.class_count) {
                        // Always use package class count for crash courses when package is selected
                        totalClasses = selectedPackage.class_count
                        
                        if (selectedPackage.validity_days) {
                            const validityEndDate = new Date(formData.start_date)
                            validityEndDate.setDate(validityEndDate.getDate() + selectedPackage.validity_days)
                            calculatedEndDate = validityEndDate.toISOString().split('T')[0]
                            description = `Crash course package: ${selectedPackage.name} (${totalClasses} classes within ${selectedPackage.validity_days} days)`
                        } else {
                            // Use package class count even without validity_days
                            calculatedEndDate = calculateCourseEndDate(formData.start_date, formData.course_duration_value || 2, formData.course_duration_unit || 'weeks')
                            description = `Crash course package: ${selectedPackage.name} (${totalClasses} classes)`
                        }
                    } else if (formData.course_duration_value && formData.course_duration_unit) {
                        // Fallback to duration-based calculation
                        calculatedEndDate = calculateCourseEndDate(formData.start_date, formData.course_duration_value, formData.course_duration_unit)
                        
                        if (formData.monthly_assignment_method === 'weekly_recurrence' && formData.weekly_days.length > 0) {
                            // Calculate based on weekly recurrence: weeks × days per week
                            const totalWeeks = formData.course_duration_unit === 'months' 
                                ? formData.course_duration_value * 4 // Approximate 4 weeks per month
                                : formData.course_duration_value // Already in weeks
                            totalClasses = Math.ceil(totalWeeks * formData.weekly_days.length)
                            description = `Crash course with weekly recurrence for ${formData.course_duration_value} ${formData.course_duration_unit} (${totalClasses} classes)`
                        } else if (formData.class_frequency) {
                            // Legacy frequency-based calculation
                            totalClasses = calculateCourseClasses(formData.course_duration_value, formData.course_duration_unit, formData.class_frequency)
                            description = `${formData.class_frequency.charAt(0).toUpperCase() + formData.class_frequency.slice(1)} crash course for ${formData.course_duration_value} ${formData.course_duration_unit} (${totalClasses} classes)`
                        } else {
                            // Default calculation if no specific method
                            totalClasses = Math.ceil(formData.course_duration_value * (formData.course_duration_unit === 'months' ? 4 : 1))
                            description = `Crash course for ${formData.course_duration_value} ${formData.course_duration_unit} (${totalClasses} classes)`
                        }
                    }
                }
                break

            case 'package':
                if (formData.start_date) {
                    // Try to get package data if package_id is selected
                    const selectedPackage = packages?.find(p => p.id === formData.package_id)
                    
                    if (selectedPackage?.class_count) {
                        // Always use package class count when available
                        totalClasses = selectedPackage.class_count
                        if (selectedPackage.validity_days) {
                            const validityEndDate = new Date(formData.start_date)
                            validityEndDate.setDate(validityEndDate.getDate() + selectedPackage.validity_days)
                            calculatedEndDate = validityEndDate.toISOString().split('T')[0]
                            description = `Package assignment: ${selectedPackage.name} (${totalClasses} classes within ${selectedPackage.validity_days} days)`
                        } else {
                            // Use package class count even without validity_days
                            calculatedEndDate = calculateCourseEndDate(formData.start_date, formData.course_duration_value || 4, formData.course_duration_unit || 'weeks')
                            description = `Package assignment: ${selectedPackage.name} (${totalClasses} classes)`
                        }
                    } else if (formData.course_duration_value && formData.course_duration_unit) {
                        // Fallback to duration-based calculation
                        calculatedEndDate = calculateCourseEndDate(formData.start_date, formData.course_duration_value, formData.course_duration_unit)
                        
                        if (formData.monthly_assignment_method === 'weekly_recurrence' && formData.weekly_days.length > 0) {
                            // Calculate based on weekly recurrence: weeks × days per week
                            const totalWeeks = formData.course_duration_unit === 'months' 
                                ? formData.course_duration_value * 4 // Approximate 4 weeks per month
                                : formData.course_duration_value // Already in weeks
                            totalClasses = Math.ceil(totalWeeks * formData.weekly_days.length)
                        } else {
                            // Default calculation for manual calendar method
                            totalClasses = Math.ceil(formData.course_duration_value * (formData.course_duration_unit === 'months' ? 4 : 1))
                        }
                        
                        description = `Package assignment for ${formData.course_duration_value} ${formData.course_duration_unit} (${totalClasses} classes)`
                    } else {
                        description = 'Package-based class assignment'
                    }
                }
                break

            case 'adhoc':
            default:
                if (formData.date) {
                    description = `Single class on ${new Date(formData.date).toLocaleDateString()}`
                    totalClasses = 1
                }
                break
        }

        setFormData(prev => ({
            ...prev,
            end_date: calculatedEndDate,
            timeline_description: description,
            total_classes: totalClasses,
            validity_end_date: calculatedEndDate
        }))
    }

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => {
            const newData = {
                ...prev,
                [field]: value
            }

            // Auto-set booking type and clear booking selection when assignment type changes
            if (field === 'assignment_type') {
                // Clear booking-related fields to refresh the selector
                newData.booking_id = ''
                newData.client_name = ''
                newData.client_email = ''
                newData.booking_ids = []
                
                // Auto-set booking type based on assignment type
                if (value === 'crash_course') {
                    newData.booking_type = 'corporate'
                } else if (value === 'weekly') {
                    newData.booking_type = 'public_group'
                } else {
                    // For other types (adhoc, monthly, package), reset to default
                    newData.booking_type = 'individual'
                }
            }

            return newData
        })

        // Clear related errors when field is updated
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }))
        }
    }

    const handleTimeChange = (field: 'start_time' | 'end_time', time: string) => {
        handleInputChange(field, time);

        if (field === 'start_time' && formData.duration) {
            // If we have  duration, calculate end time
            const startMinutes = timeToMinutes(time);
            const endMinutes = startMinutes + formData.duration;
            const endTime = minutesToTime(endMinutes);
            handleInputChange('end_time', endTime);
        } else if (field === 'end_time' && formData.start_time) {
            // Calculate duration automatically
            const startMinutes = timeToMinutes(formData.start_time);
            const endMinutes = timeToMinutes(time);
            const duration = Math.max(0, endMinutes - startMinutes);
            handleInputChange('duration', duration);
        }
    }

    const handleDurationChange = (durationMinutes: number) => {
        handleInputChange('duration', durationMinutes);
        
        if (formData.start_time) {
            // If we have a start time, calculate end time
            const startMinutes = timeToMinutes(formData.start_time);
            const endMinutes = startMinutes + durationMinutes;
            const endTime = minutesToTime(endMinutes);
            handleInputChange('end_time', endTime);
        }
    }

    const validateForm = () => {
        const newErrors: ValidationErrors = {}

        // Common validations
        if (!formData.instructor_id) newErrors.instructor_id = 'Instructor is required'
        
        // Class type validation - only required for adhoc assignments
        // For other types, class_type_id comes from package selection
        if (formData.assignment_type === 'adhoc' && !formData.class_type_id) {
            newErrors.class_type_id = 'Class type is required'
        }

        // Time validations - not required when using templates (since templates contain time info)
        const usingTemplate = formData.assignment_type === 'weekly' && formData.monthly_assignment_method === 'weekly_recurrence' && formData.selected_template_id

        if (!usingTemplate) {
            if (!formData.start_time) newErrors.start_time = 'Start time is required'
            if (!formData.end_time) newErrors.end_time = 'End time is required'
        }

        // Payment amount validation
        if (formData.payment_amount <= 0) newErrors.payment_amount = 'Payment amount must be greater than 0'

        // Assignment type specific validations
        switch (formData.assignment_type) {
            case 'adhoc':
                if (!formData.date) newErrors.date = 'Date is required'
                break

            case 'weekly':
                if (formData.monthly_assignment_method === 'weekly_recurrence') {
                    // Template assignment validation
                    if (!formData.selected_template_id) newErrors.selected_template_id = 'Please select a template'
                } else {
                    // New recurring schedule validation
                    if (!formData.start_date) newErrors.start_date = 'Start date is required'
                    if (!formData.course_duration_value) newErrors.course_duration_value = 'Duration is required'
                    if (formData.course_duration_value <= 0) newErrors.course_duration_value = 'Duration must be greater than 0'
                    if (!formData.day_of_week && formData.day_of_week !== 0) newErrors.day_of_week = 'Day of week is required'
                }
                break

            case 'monthly':
                if (!formData.start_date) newErrors.start_date = 'Start date is required'
                if (!formData.course_duration_value) newErrors.course_duration_value = 'Duration is required'
                if (formData.course_duration_value <= 0) newErrors.course_duration_value = 'Duration must be greater than 0'

                // Validate based on assignment method
                if (formData.monthly_assignment_method === 'weekly_recurrence') {
                    if (!formData.weekly_days || formData.weekly_days.length === 0) {
                        newErrors.weekly_days = 'Please select at least one day of the week'
                    }
                } else if (formData.monthly_assignment_method === 'manual_calendar') {
                    if (!formData.manual_selections || formData.manual_selections.length === 0) {
                        newErrors.manual_selections = 'Please select at least one class date and time'
                    }
                }
                break

            case 'package':
                if (!formData.package_id) newErrors.package_id = 'Package is required'
                if (!formData.start_date) newErrors.start_date = 'Start date is required'
                // Validate package exists and is regular type
                break

            case 'crash_course':
                if (!formData.package_id) newErrors.package_id = 'Package is required'
                if (!formData.start_date) newErrors.start_date = 'Start date is required'
                if (!formData.class_frequency) newErrors.class_frequency = 'Class frequency is required'
                // Validate day of month
                if (formData.day_of_month < 1 || formData.day_of_month > 31) {
                    newErrors.day_of_month = 'Day of month must be between 1 and 31'
                }
                // Validate package exists and is crash course type
                break

            default:
                // Validate package exists
                break
        }

        // Validate that end time is after start time
        if (formData.start_time && formData.end_time) {
            const startMinutes = timeToMinutes(formData.start_time)
            const endMinutes = timeToMinutes(formData.end_time)
            if (endMinutes <= startMinutes) {
                newErrors.end_time = 'End time must be after start time'
            }
        }

        // Check for conflicts (only for adhoc classes for now)
        if (formData.assignment_type === 'adhoc' && conflictCheckCallback) {
            conflictCheckCallback(formData)
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const resetForm = () => {
        setFormData(initialFormData)
        setErrors({})
        setConflictWarning(null)
    }

    return {
        formData,
        setFormData,
        errors,
        setErrors,
        conflictWarning,
        setConflictWarning,
        handleInputChange,
        handleTimeChange,
        handleDurationChange,
        validateForm,
        resetForm,
        updateTimelineInfo
    }
}