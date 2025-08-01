import { useState, useEffect } from 'react';
import { timeToMinutes, minutesToTime, calculateCourseEndDate, calculateWeeklyClasses, calculateCourseClasses } from '../utils';
const initialFormData = {
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
    weekly_days: [1, 3, 5],
    // Manual calendar selections
    manual_selections: [],
    // Booking reference fields
    booking_id: '',
    client_name: '',
    client_email: '',
    // Weekly template assignment
    selected_template_id: ''
};
export const useFormHandler = (conflictCheckCallback) => {
    const [formData, setFormData] = useState(initialFormData);
    const [errors, setErrors] = useState({});
    const [conflictWarning, setConflictWarning] = useState(null);
    // Auto-calculate end dates and timeline descriptions when relevant fields change
    useEffect(() => {
        updateTimelineInfo();
    }, [formData.assignment_type, formData.start_date, formData.course_duration_value, formData.course_duration_unit, formData.day_of_week, formData.day_of_month, formData.date]);
    // Reset payment_type to per_class if switching away from weekly and weekly-specific payment types were selected
    useEffect(() => {
        if (formData.assignment_type !== 'weekly' && (formData.payment_type === 'monthly' || formData.payment_type === 'per_member')) {
            handleInputChange('payment_type', 'per_class');
        }
    }, [formData.assignment_type]);
    const updateTimelineInfo = () => {
        let description = '';
        let calculatedEndDate = '';
        let totalClasses = 0;
        switch (formData.assignment_type) {
            case 'weekly':
                if (formData.monthly_assignment_method === 'weekly_recurrence') {
                    // Template assignment mode
                    description = 'Weekly class assignment using existing template';
                    totalClasses = 1;
                }
                else {
                    // New recurring schedule mode
                    if (formData.start_date && formData.course_duration_value && formData.course_duration_unit) {
                        calculatedEndDate = calculateCourseEndDate(formData.start_date, formData.course_duration_value, formData.course_duration_unit);
                        totalClasses = calculateWeeklyClasses(formData.start_date, calculatedEndDate);
                        description = `Weekly classes for ${formData.course_duration_value} ${formData.course_duration_unit} (${totalClasses} classes)`;
                    }
                }
                break;
            case 'monthly':
                if (formData.start_date && formData.course_duration_value && formData.course_duration_unit) {
                    calculatedEndDate = calculateCourseEndDate(formData.start_date, formData.course_duration_value, formData.course_duration_unit);
                    totalClasses = Math.ceil(formData.course_duration_value * (formData.course_duration_unit === 'months' ? 1 : 0.25));
                    description = `Monthly classes for ${formData.course_duration_value} ${formData.course_duration_unit} (${totalClasses} classes)`;
                }
                break;
            case 'crash_course':
                if (formData.start_date && formData.course_duration_value && formData.course_duration_unit && formData.class_frequency) {
                    calculatedEndDate = calculateCourseEndDate(formData.start_date, formData.course_duration_value, formData.course_duration_unit);
                    totalClasses = calculateCourseClasses(formData.course_duration_value, formData.course_duration_unit, formData.class_frequency);
                    description = `${formData.class_frequency.charAt(0).toUpperCase() + formData.class_frequency.slice(1)} crash course for ${formData.course_duration_value} ${formData.course_duration_unit} (${totalClasses} classes)`;
                }
                break;
            case 'package':
                description = 'Package-based class assignment';
                break;
            case 'adhoc':
            default:
                if (formData.date) {
                    description = `Single class on ${new Date(formData.date).toLocaleDateString()}`;
                    totalClasses = 1;
                }
                break;
        }
        setFormData(prev => ({
            ...prev,
            end_date: calculatedEndDate,
            timeline_description: description,
            total_classes: totalClasses
        }));
    };
    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        // Clear related errors when field is updated
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };
    const handleTimeChange = (field, time) => {
        handleInputChange(field, time);
        if (field === 'start_time' && formData.duration) {
            // If we have  duration, calculate end time
            const startMinutes = timeToMinutes(time);
            const endMinutes = startMinutes + formData.duration;
            const endTime = minutesToTime(endMinutes);
            handleInputChange('end_time', endTime);
        }
        else if (field === 'end_time' && formData.start_time) {
            // Calculate duration automatically
            const startMinutes = timeToMinutes(formData.start_time);
            const endMinutes = timeToMinutes(time);
            const duration = Math.max(0, endMinutes - startMinutes);
            handleInputChange('duration', duration);
        }
    };
    const handleDurationChange = (durationMinutes) => {
        handleInputChange('duration', durationMinutes);
        if (formData.start_time) {
            // If we have a start time, calculate end time
            const startMinutes = timeToMinutes(formData.start_time);
            const endMinutes = startMinutes + durationMinutes;
            const endTime = minutesToTime(endMinutes);
            handleInputChange('end_time', endTime);
        }
    };
    const validateForm = () => {
        const newErrors = {};
        // Common validations
        if (!formData.instructor_id)
            newErrors.instructor_id = 'Instructor is required';
        // Class type validation - only required for adhoc assignments
        // For other types, class_type_id comes from package selection
        if (formData.assignment_type === 'adhoc' && !formData.class_type_id) {
            newErrors.class_type_id = 'Class type is required';
        }
        // Time validations - not required when using templates (since templates contain time info)
        const usingTemplate = formData.assignment_type === 'weekly' && formData.monthly_assignment_method === 'weekly_recurrence' && formData.selected_template_id;
        if (!usingTemplate) {
            if (!formData.start_time)
                newErrors.start_time = 'Start time is required';
            if (!formData.end_time)
                newErrors.end_time = 'End time is required';
        }
        // Payment amount validation
        if (formData.payment_amount <= 0)
            newErrors.payment_amount = 'Payment amount must be greater than 0';
        // Assignment type specific validations
        switch (formData.assignment_type) {
            case 'adhoc':
                if (!formData.date)
                    newErrors.date = 'Date is required';
                break;
            case 'weekly':
                if (formData.monthly_assignment_method === 'weekly_recurrence') {
                    // Template assignment validation
                    if (!formData.selected_template_id)
                        newErrors.selected_template_id = 'Please select a template';
                }
                else {
                    // New recurring schedule validation
                    if (!formData.start_date)
                        newErrors.start_date = 'Start date is required';
                    if (!formData.course_duration_value)
                        newErrors.course_duration_value = 'Duration is required';
                    if (formData.course_duration_value <= 0)
                        newErrors.course_duration_value = 'Duration must be greater than 0';
                    if (!formData.day_of_week && formData.day_of_week !== 0)
                        newErrors.day_of_week = 'Day of week is required';
                }
                break;
            case 'monthly':
                if (!formData.start_date)
                    newErrors.start_date = 'Start date is required';
                if (!formData.course_duration_value)
                    newErrors.course_duration_value = 'Duration is required';
                if (formData.course_duration_value <= 0)
                    newErrors.course_duration_value = 'Duration must be greater than 0';
                // Validate based on assignment method
                if (formData.monthly_assignment_method === 'weekly_recurrence') {
                    if (!formData.weekly_days || formData.weekly_days.length === 0) {
                        newErrors.weekly_days = 'Please select at least one day of the week';
                    }
                }
                else if (formData.monthly_assignment_method === 'manual_calendar') {
                    if (!formData.manual_selections || formData.manual_selections.length === 0) {
                        newErrors.manual_selections = 'Please select at least one class date and time';
                    }
                }
                break;
            case 'package':
                if (!formData.package_id)
                    newErrors.package_id = 'Package is required';
                if (!formData.start_date)
                    newErrors.start_date = 'Start date is required';
                // Validate package exists and is regular type
                break;
            case 'crash_course':
                if (!formData.package_id)
                    newErrors.package_id = 'Package is required';
                if (!formData.start_date)
                    newErrors.start_date = 'Start date is required';
                if (!formData.class_frequency)
                    newErrors.class_frequency = 'Class frequency is required';
                // Validate day of month
                if (formData.day_of_month < 1 || formData.day_of_month > 31) {
                    newErrors.day_of_month = 'Day of month must be between 1 and 31';
                }
                // Validate package exists and is crash course type
                break;
            default:
                // Validate package exists
                break;
        }
        // Validate that end time is after start time
        if (formData.start_time && formData.end_time) {
            const startMinutes = timeToMinutes(formData.start_time);
            const endMinutes = timeToMinutes(formData.end_time);
            if (endMinutes <= startMinutes) {
                newErrors.end_time = 'End time must be after start time';
            }
        }
        // Check for conflicts (only for adhoc classes for now)
        if (formData.assignment_type === 'adhoc' && conflictCheckCallback) {
            conflictCheckCallback(formData);
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const resetForm = () => {
        setFormData(initialFormData);
        setErrors({});
        setConflictWarning(null);
    };
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
    };
};
