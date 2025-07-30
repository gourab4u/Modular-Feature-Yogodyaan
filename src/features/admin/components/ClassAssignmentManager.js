import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Calendar, Clock, DollarSign, Plus, Save, Users, X, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../../../shared/components/ui/Button';
import { LoadingSpinner } from '../../../shared/components/ui/LoadingSpinner';
import ClockSelector from '../../../shared/components/ui/ClockSelector';
import { supabase } from '../../../shared/lib/supabase';
export function ClassAssignmentManager() {
    const [assignments, setAssignments] = useState([]);
    const [weeklySchedules, setWeeklySchedules] = useState([]);
    const [classTypes, setClassTypes] = useState([]);
    const [packages, setPackages] = useState([]);
    const [userProfiles, setUserProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAssignForm, setShowAssignForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [conflictWarning, setConflictWarning] = useState(null);
    const [formData, setFormData] = useState({
        // Assignment type selection
        assignment_type: 'adhoc', // 'adhoc', 'weekly', 'monthly', 'crash_course', 'package'
        // Basic fields
        class_type_id: '',
        instructor_id: '',
        payment_amount: 0,
        notes: '',
        // Date/Time fields (varies by type)
        date: '', // For adhoc classes
        start_time: '',
        end_time: '',
        duration: 60, // duration in minutes for single classes
        // Recurring fields
        start_date: '', // For recurring and courses
        end_date: '', // For recurring and courses
        day_of_week: 0, // For weekly (0-6, Sunday-Saturday)
        day_of_month: 1, // For monthly (1-31, or special values like -1 for last day)
        // Course fields
        course_duration_value: 1, // e.g., "2" in "2 months"
        course_duration_unit: 'months', // 'weeks', 'months'
        class_frequency: 'weekly', // 'daily', 'weekly', 'specific'
        specific_days: [], // For specific days in crash courses
        // Package fields
        package_id: '',
        // Generated/calculated fields
        timeline_description: '',
        total_classes: 0
    });
    useEffect(() => {
        fetchData();
    }, []);
    // Auto-calculate end dates and timeline descriptions when relevant fields change
    useEffect(() => {
        updateTimelineInfo();
    }, [formData.assignment_type, formData.start_date, formData.course_duration_value, formData.course_duration_unit, formData.day_of_week, formData.day_of_month]);
    const updateTimelineInfo = () => {
        let description = '';
        let calculatedEndDate = '';
        let totalClasses = 0;
        switch (formData.assignment_type) {
            case 'adhoc':
                description = formData.date ? `One-time adhoc class on ${formatDate(formData.date)}` : 'Select date for one-time adhoc class';
                totalClasses = 1;
                break;
            case 'weekly':
                if (formData.start_date && formData.end_date) {
                    const dayName = getDayName(formData.day_of_week);
                    description = `Recurring weekly ${dayName} classes from ${formatDate(formData.start_date)} recurring till ${formatDate(formData.end_date)}`;
                    totalClasses = calculateWeeklyClasses(formData.start_date, formData.end_date);
                }
                else if (formData.start_date) {
                    const dayName = getDayName(formData.day_of_week);
                    description = `Recurring weekly ${dayName} classes starting ${formatDate(formData.start_date)} - select end date (till end of year)`;
                }
                else {
                    description = 'Set up recurring weekly schedule with start date and recurring till date';
                }
                break;
            case 'monthly':
                if (formData.start_date && formData.end_date) {
                    const dayDesc = formData.day_of_month === -1 ? 'last day' : `${formData.day_of_month}${getOrdinalSuffix(formData.day_of_month)}`;
                    description = `Monthly recurring on ${dayDesc} of each month from ${formatDate(formData.start_date)} recurring till ${formatDate(formData.end_date)}`;
                    totalClasses = calculateMonthlyClasses(formData.start_date, formData.end_date);
                }
                else if (formData.start_date) {
                    const dayDesc = formData.day_of_month === -1 ? 'last day' : `${formData.day_of_month}${getOrdinalSuffix(formData.day_of_month)}`;
                    description = `Monthly recurring on ${dayDesc} starting ${formatDate(formData.start_date)} - select end date (till end of year)`;
                }
                else {
                    description = 'Set up monthly recurring classes with start date and recurring till date';
                }
                break;
            case 'crash_course':
                if (formData.start_date) {
                    calculatedEndDate = calculateCourseEndDate(formData.start_date, formData.course_duration_value, formData.course_duration_unit);
                    description = `Crash course: ${formData.course_duration_value} ${formData.course_duration_unit} duration. Start Date: ${formatDate(formData.start_date)} → End Date: ${formatDate(calculatedEndDate)} (Auto-calculated)`;
                    totalClasses = calculateCourseClasses(formData.course_duration_value, formData.course_duration_unit, formData.class_frequency);
                    // Auto-set end date
                    if (calculatedEndDate !== formData.end_date) {
                        setFormData(prev => ({ ...prev, end_date: calculatedEndDate }));
                    }
                }
                else {
                    description = `Set up crash course: ${formData.course_duration_value} ${formData.course_duration_unit} duration (end date will be auto-calculated)`;
                }
                break;
            default:
                description = 'Select assignment type to see timeline preview';
        }
        setFormData(prev => ({
            ...prev,
            timeline_description: description,
            total_classes: totalClasses
        }));
    };
    const calculateCourseEndDate = (startDate, duration, unit) => {
        const start = new Date(startDate);
        const end = new Date(start);
        if (unit === 'weeks') {
            end.setDate(start.getDate() + (duration * 7));
        }
        else if (unit === 'months') {
            end.setMonth(start.getMonth() + duration);
        }
        return end.toISOString().split('T')[0];
    };
    const calculateWeeklyClasses = (startDate, endDate) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const weeks = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7));
        return Math.max(1, weeks);
    };
    const calculateMonthlyClasses = (startDate, endDate) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
        return Math.max(1, months);
    };
    const calculateCourseClasses = (duration, unit, frequency) => {
        const totalWeeks = unit === 'weeks' ? duration : duration * 4; // Approximate weeks
        switch (frequency) {
            case 'daily':
                return totalWeeks * 7;
            case 'weekly':
                return totalWeeks;
            default:
                return totalWeeks; // Default to weekly
        }
    };
    const getDayName = (dayOfWeek) => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[dayOfWeek];
    };
    const getOrdinalSuffix = (day) => {
        if (day > 3 && day < 21)
            return 'th';
        switch (day % 10) {
            case 1: return 'st';
            case 2: return 'nd';
            case 3: return 'rd';
            default: return 'th';
        }
    };
    // Check for scheduling conflicts when relevant fields change
    useEffect(() => {
        if (formData.instructor_id && formData.date && formData.start_time && formData.end_time) {
            checkForConflicts();
        }
        else {
            setConflictWarning(null);
        }
    }, [formData.instructor_id, formData.date, formData.start_time, formData.end_time]);
    const fetchData = async () => {
        try {
            setLoading(true);
            const { data: classTypesData } = await supabase.from('class_types').select('id, name, difficulty_level, course_type');
            const { data: packagesData } = await supabase.from('class_packages').select('id, name, description, duration, price, class_count, validity_days, type, course_type').eq('is_active', true).eq('is_archived', false);
            const { data: roles } = await supabase
                .from('roles')
                .select('id, name')
                .in('name', ['instructor', 'yoga_acharya']);
            const roleIds = roles?.map(r => r.id) || [];
            const { data: userRoles } = await supabase
                .from('user_roles')
                .select('user_id, role_id')
                .in('role_id', roleIds);
            const userIds = [...new Set(userRoles?.map(ur => ur.user_id) || [])];
            const { data: profiles } = await supabase
                .from('profiles')
                .select('user_id, full_name, email')
                .in('user_id', userIds);
            const profilesWithRoles = (profiles || []).map(profile => {
                const userRoleIds = (userRoles || []).filter(ur => ur.user_id === profile.user_id).map(ur => ur.role_id);
                const profileRoles = (roles || []).filter(role => userRoleIds.includes(role.id)).map(role => ({ roles: { name: role.name } }));
                return {
                    ...profile,
                    user_roles: profileRoles
                };
            });
            // Fetch all assignments (all are now 'adhoc' in schedule_type, differentiated by package_id vs class_type_id)
            const { data: assignmentsData } = await supabase
                .from('class_assignments')
                .select('*')
                .eq('schedule_type', 'adhoc')
                .order('assigned_at', { ascending: false });
            // Fetch weekly schedules
            const { data: weeklySchedulesData } = await supabase
                .from('class_schedules')
                .select('*')
                .eq('is_active', true)
                .order('day_of_week', { ascending: true });
            const enrichedAssignments = (assignmentsData || []).map(assignment => {
                const classType = classTypesData?.find(ct => ct.id === assignment.class_type_id);
                const instructorProfile = profilesWithRoles.find(p => p.user_id === assignment.instructor_id);
                return {
                    ...assignment,
                    class_type: classType,
                    instructor_profile: instructorProfile
                };
            });
            const enrichedWeeklySchedules = (weeklySchedulesData || []).map(schedule => {
                const classType = classTypesData?.find(ct => ct.id === schedule.class_type_id);
                const instructorProfile = profilesWithRoles.find(p => p.user_id === schedule.instructor_id);
                return {
                    ...schedule,
                    class_type: classType,
                    instructor_profile: instructorProfile
                };
            });
            setClassTypes(classTypesData || []);
            setPackages(packagesData || []);
            setUserProfiles(profilesWithRoles);
            setAssignments(enrichedAssignments);
            setWeeklySchedules(enrichedWeeklySchedules);
        }
        catch (e) {
            console.error('Fetch error:', e);
        }
        finally {
            setLoading(false);
        }
    };
    const checkForConflicts = () => {
        if (!formData.instructor_id || !formData.date || !formData.start_time || !formData.end_time) {
            setConflictWarning(null);
            return;
        }
        const proposedStart = timeToMinutes(formData.start_time);
        const proposedEnd = timeToMinutes(formData.end_time);
        const proposedDate = new Date(formData.date);
        const proposedDayOfWeek = proposedDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
        // Check for conflicts with existing adhoc assignments
        const conflictingAssignment = assignments.find(assignment => {
            // Only check assignments that are not cancelled
            if (assignment.class_status === 'cancelled')
                return false;
            // Check if same instructor and same date
            if (assignment.instructor_id === formData.instructor_id && assignment.date === formData.date) {
                if (assignment.start_time && assignment.end_time) {
                    const existingStart = timeToMinutes(assignment.start_time);
                    const existingEnd = timeToMinutes(assignment.end_time);
                    // Check if times overlap
                    return (proposedStart < existingEnd && proposedEnd > existingStart);
                }
            }
            return false;
        });
        // Check for conflicts with weekly schedules
        const conflictingWeeklySchedule = weeklySchedules.find(schedule => {
            // Only check active schedules
            if (!schedule.is_active)
                return false;
            // Check if same instructor and same day of week
            if (schedule.instructor_id === formData.instructor_id && schedule.day_of_week === proposedDayOfWeek) {
                if (schedule.start_time && schedule.end_time) {
                    const existingStart = timeToMinutes(schedule.start_time);
                    const existingEnd = timeToMinutes(schedule.end_time);
                    // Check if times overlap
                    return (proposedStart < existingEnd && proposedEnd > existingStart);
                }
            }
            return false;
        });
        const instructor = userProfiles.find(p => p.user_id === formData.instructor_id);
        if (conflictingAssignment) {
            const conflictTime = `${formatTime(conflictingAssignment.start_time)} - ${formatTime(conflictingAssignment.end_time)}`;
            setConflictWarning({
                hasConflict: true,
                conflictingClass: conflictingAssignment,
                message: `${instructor?.full_name || 'This instructor'} already has an adhoc class scheduled from ${conflictTime} on ${formatDate(formData.date)}`
            });
        }
        else if (conflictingWeeklySchedule) {
            const conflictTime = `${formatTime(conflictingWeeklySchedule.start_time)} - ${formatTime(conflictingWeeklySchedule.end_time)}`;
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const dayName = dayNames[proposedDayOfWeek];
            setConflictWarning({
                hasConflict: true,
                conflictingClass: conflictingWeeklySchedule, // Type assertion since we're reusing the interface
                message: `${instructor?.full_name || 'This instructor'} has a weekly recurring class scheduled from ${conflictTime} every ${dayName}`
            });
        }
        else {
            setConflictWarning(null);
        }
    };
    const getAvailableInstructors = () => {
        if (!formData.date || !formData.start_time || !formData.end_time) {
            return userProfiles;
        }
        const proposedStart = timeToMinutes(formData.start_time);
        const proposedEnd = timeToMinutes(formData.end_time);
        const proposedDate = new Date(formData.date);
        const proposedDayOfWeek = proposedDate.getDay();
        return userProfiles.filter(instructor => {
            // Check for conflicts with adhoc assignments
            const hasAdhocConflict = assignments.some(assignment => {
                if (assignment.class_status === 'cancelled')
                    return false;
                if (assignment.instructor_id === instructor.user_id && assignment.date === formData.date) {
                    if (assignment.start_time && assignment.end_time) {
                        const existingStart = timeToMinutes(assignment.start_time);
                        const existingEnd = timeToMinutes(assignment.end_time);
                        return (proposedStart < existingEnd && proposedEnd > existingStart);
                    }
                }
                return false;
            });
            // Check for conflicts with weekly schedules
            const hasWeeklyConflict = weeklySchedules.some(schedule => {
                if (!schedule.is_active)
                    return false;
                if (schedule.instructor_id === instructor.user_id && schedule.day_of_week === proposedDayOfWeek) {
                    if (schedule.start_time && schedule.end_time) {
                        const existingStart = timeToMinutes(schedule.start_time);
                        const existingEnd = timeToMinutes(schedule.end_time);
                        return (proposedStart < existingEnd && proposedEnd > existingStart);
                    }
                }
                return false;
            });
            return !hasAdhocConflict && !hasWeeklyConflict;
        });
    };
    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: '' }));
        }
    };
    // Helper function to convert time to minutes
    const timeToMinutes = (timeString) => {
        if (!timeString)
            return 0;
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    };
    // Helper function to convert minutes to time string
    const minutesToTime = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    };
    const handleStartTimeChange = (time) => {
        handleInputChange('start_time', time);
        // If we have a duration, calculate end time
        if (formData.duration > 0) {
            const startMinutes = timeToMinutes(time);
            const endMinutes = startMinutes + formData.duration;
            const endTime = minutesToTime(endMinutes);
            handleInputChange('end_time', endTime);
        }
    };
    const handleEndTimeChange = (time) => {
        handleInputChange('end_time', time);
        // Calculate duration automatically
        if (formData.start_time) {
            const startMinutes = timeToMinutes(formData.start_time);
            const endMinutes = timeToMinutes(time);
            const duration = endMinutes - startMinutes;
            if (duration > 0) {
                handleInputChange('duration', duration);
            }
        }
    };
    const handleDurationChange = (durationMinutes) => {
        handleInputChange('duration', durationMinutes);
        // If we have a start time, calculate end time
        if (formData.start_time) {
            const startMinutes = timeToMinutes(formData.start_time);
            const endMinutes = startMinutes + durationMinutes;
            const endTime = minutesToTime(endMinutes);
            handleInputChange('end_time', endTime);
        }
    };
    const validateForm = () => {
        const newErrors = {};
        // Common validations - only for non-monthly assignments
        if (formData.assignment_type !== 'monthly' && !formData.class_type_id) {
            newErrors.class_type_id = 'Class type is required';
        }
        if (!formData.instructor_id)
            newErrors.instructor_id = 'Instructor is required';
        if (!formData.start_time)
            newErrors.start_time = 'Start time is required';
        if (!formData.end_time)
            newErrors.end_time = 'End time is required';
        if (formData.payment_amount <= 0)
            newErrors.payment_amount = 'Amount must be greater than 0';
        // Assignment type specific validations
        switch (formData.assignment_type) {
            case 'adhoc':
                if (!formData.date)
                    newErrors.date = 'Date is required';
                break;
            case 'weekly':
                if (!formData.start_date)
                    newErrors.start_date = 'Start date is required';
                if (!formData.end_date)
                    newErrors.end_date = 'End date is required';
                if (formData.start_date && formData.end_date && formData.start_date >= formData.end_date) {
                    newErrors.end_date = 'End date must be after start date';
                }
                break;
            case 'monthly':
                if (!formData.package_id)
                    newErrors.package_id = 'Package is required';
                if (!formData.start_date)
                    newErrors.start_date = 'Start date is required';
                if (!formData.end_date)
                    newErrors.end_date = 'End date is required';
                if (formData.start_date && formData.end_date && formData.start_date >= formData.end_date) {
                    newErrors.end_date = 'End date must be after start date';
                }
                break;
            case 'crash_course':
                if (!formData.package_id)
                    newErrors.package_id = 'Package is required';
                if (!formData.start_date)
                    newErrors.start_date = 'Start date is required';
                if (formData.course_duration_value < 1)
                    newErrors.course_duration_value = 'Duration must be at least 1';
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
        if (formData.assignment_type === 'adhoc' && conflictWarning?.hasConflict) {
            newErrors.conflict = 'Please resolve the scheduling conflict before proceeding';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const getDurationOptions = () => [
        { value: 30, label: '30 minutes' },
        { value: 60, label: '1 hour' },
        { value: 90, label: '1 hour 30 minutes' },
        { value: 120, label: '2 hours' }
    ];
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        }
        else if (date.toDateString() === tomorrow.toDateString()) {
            return 'Tomorrow';
        }
        else {
            return date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            });
        }
    };
    const formatTime = (timeString) => {
        // Handle null or undefined timeString
        if (!timeString) {
            return '—';
        }
        // Handle empty string
        if (timeString.trim() === '') {
            return '—';
        }
        try {
            const [hours, minutes] = timeString.split(':').map(Number);
            // Validate that we got valid numbers
            if (isNaN(hours) || isNaN(minutes)) {
                return '—';
            }
            const date = new Date();
            date.setHours(hours, minutes);
            return date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        }
        catch (error) {
            console.error('Error formatting time:', timeString, error);
            return '—';
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm())
            return;
        try {
            setSaving(true);
            const currentUser = await supabase.auth.getUser();
            const currentUserId = currentUser.data.user?.id || '';
            switch (formData.assignment_type) {
                case 'adhoc':
                    await createAdhocAssignment(currentUserId);
                    break;
                case 'weekly':
                    await createWeeklySchedule(currentUserId);
                    break;
                case 'monthly':
                    await createMonthlyAssignments(currentUserId);
                    break;
                case 'crash_course':
                    await createCrashCourseAssignments(currentUserId);
                    break;
                case 'package':
                    await createPackageAssignments(currentUserId);
                    break;
                default:
                    throw new Error('Invalid assignment type');
            }
            await fetchData();
            setShowAssignForm(false);
            resetForm();
            setConflictWarning(null);
            alert(`${formData.assignment_type.replace('_', ' ')} assignment created successfully`);
        }
        catch (err) {
            console.error('Submit error:', err);
            setErrors({ general: err.message });
        }
        finally {
            setSaving(false);
        }
    };
    const resetForm = () => {
        setFormData({
            // Assignment type selection
            assignment_type: 'adhoc',
            // Basic fields
            class_type_id: '',
            instructor_id: '',
            payment_amount: 0,
            notes: '',
            // Date/Time fields (varies by type)
            date: '',
            start_time: '',
            end_time: '',
            duration: 60,
            // Recurring fields
            start_date: '',
            end_date: '',
            day_of_week: 0,
            day_of_month: 1,
            // Course fields
            course_duration_value: 1,
            course_duration_unit: 'months',
            class_frequency: 'weekly',
            specific_days: [],
            // Package fields
            package_id: '',
            // Generated/calculated fields
            timeline_description: '',
            total_classes: 0
        });
    };
    const createAdhocAssignment = async (currentUserId) => {
        const assignment = {
            class_type_id: formData.class_type_id,
            date: formData.date,
            start_time: formData.start_time,
            end_time: formData.end_time,
            instructor_id: formData.instructor_id,
            payment_amount: formData.payment_amount,
            notes: formData.notes,
            schedule_type: 'adhoc',
            assigned_by: currentUserId,
            assigned_at: new Date().toISOString(),
            class_status: 'scheduled',
            payment_status: 'pending',
            payment_date: null
        };
        console.log('Creating adhoc assignment:', assignment);
        const { error } = await supabase.from('class_assignments').insert([assignment]);
        if (error) {
            console.error('Adhoc assignment creation error:', error);
            throw error;
        }
    };
    const createWeeklySchedule = async (currentUserId) => {
        const schedule = {
            class_type_id: formData.class_type_id,
            instructor_id: formData.instructor_id,
            day_of_week: formData.day_of_week,
            start_time: formData.start_time,
            end_time: formData.end_time,
            duration_minutes: formData.duration,
            created_by: currentUserId,
            created_at: new Date().toISOString(),
            is_active: true,
            start_date: formData.start_date,
            end_date: formData.end_date,
            notes: `Weekly recurring class: ${formData.notes || 'Auto-generated schedule'}`
        };
        console.log('Creating weekly schedule:', schedule);
        const { error } = await supabase.from('class_schedules').insert([schedule]);
        if (error) {
            console.error('Weekly schedule creation error:', error);
            throw error;
        }
    };
    const createMonthlyAssignments = async (currentUserId) => {
        const assignments = [];
        const startDate = new Date(formData.start_date);
        const endDate = new Date(formData.end_date);
        // Generate all monthly occurrences
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            // Calculate the actual date for this month
            let classDate = new Date(currentDate);
            if (formData.day_of_month === -1) {
                // Last day of month
                classDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
            }
            else {
                // Specific day of month
                classDate.setDate(formData.day_of_month);
                // If the day doesn't exist in this month (e.g., Feb 31st), use the last day
                if (classDate.getMonth() !== currentDate.getMonth()) {
                    classDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
                }
            }
            assignments.push({
                package_id: formData.package_id,
                date: classDate.toISOString().split('T')[0],
                start_time: formData.start_time,
                end_time: formData.end_time,
                instructor_id: formData.instructor_id,
                payment_amount: formData.payment_amount,
                notes: `Regular Package (Monthly recurring): ${formData.notes || 'Auto-generated'}`,
                schedule_type: 'adhoc',
                assigned_by: currentUserId,
                assigned_at: new Date().toISOString(),
                class_status: 'scheduled',
                payment_status: 'pending',
                payment_date: null
            });
            // Move to next month
            currentDate.setMonth(currentDate.getMonth() + 1);
        }
        console.log('Creating monthly assignments:', assignments.length, 'classes');
        const { error } = await supabase.from('class_assignments').insert(assignments);
        if (error) {
            console.error('Monthly assignments creation error:', error);
            throw error;
        }
    };
    const createCrashCourseAssignments = async (currentUserId) => {
        const assignments = [];
        const startDate = new Date(formData.start_date);
        const endDate = new Date(formData.end_date);
        // Generate class dates based on frequency
        const classDates = [];
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            classDates.push(new Date(currentDate));
            if (formData.class_frequency === 'daily') {
                currentDate.setDate(currentDate.getDate() + 1);
            }
            else if (formData.class_frequency === 'weekly') {
                currentDate.setDate(currentDate.getDate() + 7);
            }
            else if (formData.class_frequency === 'specific') {
                // TODO: Implement specific days logic based on formData.specific_days
                currentDate.setDate(currentDate.getDate() + 7); // Default to weekly for now
            }
        }
        // Create assignments for each date
        for (const classDate of classDates) {
            assignments.push({
                package_id: formData.package_id,
                date: classDate.toISOString().split('T')[0],
                start_time: formData.start_time,
                end_time: formData.end_time,
                instructor_id: formData.instructor_id,
                payment_amount: formData.payment_amount,
                notes: `Crash course (${formData.course_duration_value} ${formData.course_duration_unit}): ${formData.notes || 'Auto-generated'}`,
                schedule_type: 'adhoc',
                assigned_by: currentUserId,
                assigned_at: new Date().toISOString(),
                class_status: 'scheduled',
                payment_status: 'pending',
                payment_date: null
            });
        }
        console.log('Creating crash course assignments:', assignments.length, 'classes');
        const { error } = await supabase.from('class_assignments').insert(assignments);
        if (error) {
            console.error('Crash course assignments creation error:', error);
            throw error;
        }
    };
    const createPackageAssignments = async (_currentUserId) => {
        // TODO: Implement package assignment logic
        // This would involve:
        // 1. Fetching package definition from packages table
        // 2. Creating assignments based on package structure
        // 3. Possibly creating a package_assignments table entry
        console.log('Package assignments not yet implemented');
        throw new Error('Package assignments are not yet implemented. Please implement based on your package structure.');
    };
    const availableInstructors = getAvailableInstructors();
    return (_jsxs("div", { className: "space-y-6 p-4", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("h2", { className: "text-xl font-bold text-gray-900 flex items-center", children: [_jsx(Users, { className: "w-5 h-5 mr-2" }), " Class Assignment Manager"] }), _jsxs(Button, { onClick: () => setShowAssignForm(true), children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), " Assign Class"] })] }), showAssignForm && (_jsxs("div", { className: "bg-white shadow p-6 rounded-lg max-w-2xl mx-auto", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Assign New Class" }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => {
                                    setShowAssignForm(false);
                                    setConflictWarning(null);
                                }, children: _jsx(X, { className: "w-4 h-4" }) })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [errors.general && _jsx("div", { className: "text-red-500 text-sm", children: errors.general }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Assignment Type" }), _jsxs("select", { value: formData.assignment_type, onChange: (e) => handleInputChange('assignment_type', e.target.value), className: "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "adhoc", children: "Adhoc Class (One-time class with selectable date)" }), _jsx("option", { value: "weekly", children: "Weekly Recurring (Recurring weekly classes till end date)" }), _jsx("option", { value: "monthly", children: "Regular Packages (Monthly recurring packages)" }), _jsx("option", { value: "crash_course", children: "Crash Course (Fixed duration course with auto-calculated end date)" })] }), errors.assignment_type && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.assignment_type })] }), formData.timeline_description && (_jsxs("div", { className: "bg-blue-50 border border-blue-200 rounded-lg p-4", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx(Calendar, { className: "w-4 h-4 text-blue-600" }), _jsx("span", { className: "font-medium text-blue-800", children: "Assignment Timeline" })] }), _jsx("p", { className: "text-blue-700", children: formData.timeline_description }), formData.total_classes > 0 && (_jsxs("p", { className: "text-sm text-blue-600 mt-1", children: ["Total estimated classes: ", formData.total_classes] }))] })), _jsxs("div", { children: [formData.assignment_type === 'crash_course' && (_jsxs(_Fragment, { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Crash Course Package" }), _jsxs("select", { value: formData.package_id, onChange: (e) => handleInputChange('package_id', e.target.value), className: "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "", children: "Select crash course package" }), packages.filter(pkg => pkg.course_type === 'crash').map(pkg => (_jsxs("option", { value: pkg.id, children: [pkg.name, " - ", pkg.type || 'Standard', " (", pkg.duration, " - ", pkg.class_count, " classes - \u20B9", pkg.price, ")"] }, pkg.id)))] }), errors.package_id && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.package_id }), formData.package_id && (() => {
                                                const selectedPkg = packages.find(pkg => pkg.id === formData.package_id);
                                                return selectedPkg && (_jsx("div", { className: "mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md", children: _jsxs("div", { className: "text-sm text-blue-800", children: [_jsx("div", { className: "flex items-center gap-2 mb-1", children: _jsx("span", { className: "font-medium", children: "Package Details:" }) }), _jsxs("div", { className: "grid grid-cols-2 gap-2 text-xs", children: [_jsxs("div", { children: [_jsx("strong", { children: "Type:" }), " ", selectedPkg.type || 'Standard'] }), _jsxs("div", { children: [_jsx("strong", { children: "Duration:" }), " ", selectedPkg.duration] }), _jsxs("div", { children: [_jsx("strong", { children: "Classes:" }), " ", selectedPkg.class_count] }), _jsxs("div", { children: [_jsx("strong", { children: "Price:" }), " \u20B9", selectedPkg.price] }), selectedPkg.validity_days && _jsxs("div", { children: [_jsx("strong", { children: "Validity:" }), " ", selectedPkg.validity_days, " days"] }), selectedPkg.description && _jsxs("div", { className: "col-span-2", children: [_jsx("strong", { children: "Description:" }), " ", selectedPkg.description] })] })] }) }));
                                            })()] })), formData.assignment_type === 'monthly' && (_jsxs(_Fragment, { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Regular Package" }), _jsxs("select", { value: formData.package_id, onChange: (e) => handleInputChange('package_id', e.target.value), className: "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "", children: "Select regular package" }), packages.filter(pkg => pkg.course_type === 'regular').map(pkg => (_jsxs("option", { value: pkg.id, children: [pkg.name, " - ", pkg.type || 'Standard', " (", pkg.duration, " - ", pkg.class_count, " classes - \u20B9", pkg.price, ")"] }, pkg.id)))] }), errors.package_id && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.package_id }), formData.package_id && (() => {
                                                const selectedPkg = packages.find(pkg => pkg.id === formData.package_id);
                                                return selectedPkg && (_jsx("div", { className: "mt-2 p-3 bg-green-50 border border-green-200 rounded-md", children: _jsxs("div", { className: "text-sm text-green-800", children: [_jsx("div", { className: "flex items-center gap-2 mb-1", children: _jsx("span", { className: "font-medium", children: "Package Details:" }) }), _jsxs("div", { className: "grid grid-cols-2 gap-2 text-xs", children: [_jsxs("div", { children: [_jsx("strong", { children: "Type:" }), " ", selectedPkg.type || 'Standard'] }), _jsxs("div", { children: [_jsx("strong", { children: "Duration:" }), " ", selectedPkg.duration] }), _jsxs("div", { children: [_jsx("strong", { children: "Classes:" }), " ", selectedPkg.class_count] }), _jsxs("div", { children: [_jsx("strong", { children: "Price:" }), " \u20B9", selectedPkg.price] }), selectedPkg.validity_days && _jsxs("div", { children: [_jsx("strong", { children: "Validity:" }), " ", selectedPkg.validity_days, " days"] }), selectedPkg.description && _jsxs("div", { className: "col-span-2", children: [_jsx("strong", { children: "Description:" }), " ", selectedPkg.description] })] })] }) }));
                                            })()] })), (formData.assignment_type === 'adhoc' || formData.assignment_type === 'weekly') && (_jsxs(_Fragment, { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Class Type" }), _jsxs("select", { value: formData.class_type_id, onChange: (e) => handleInputChange('class_type_id', e.target.value), className: "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "", children: "Select class type" }), classTypes.map(ct => (_jsxs("option", { value: ct.id, children: [ct.name, " (", ct.difficulty_level, ")"] }, ct.id)))] }), errors.class_type_id && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.class_type_id })] }))] }), formData.assignment_type === 'adhoc' && (_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: [_jsx(Calendar, { className: "w-4 h-4 inline mr-1" }), "Class Date"] }), _jsx("input", { type: "date", value: formData.date, onChange: (e) => handleInputChange('date', e.target.value), min: new Date().toISOString().split('T')[0], className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" }), errors.date && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.date })] })), (formData.assignment_type === 'weekly' || formData.assignment_type === 'monthly' || formData.assignment_type === 'crash_course') && (_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: [_jsx(Calendar, { className: "w-4 h-4 inline mr-1" }), "Start Date"] }), _jsx("input", { type: "date", value: formData.start_date, onChange: (e) => handleInputChange('start_date', e.target.value), min: new Date().toISOString().split('T')[0], className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" }), errors.start_date && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.start_date })] }), formData.assignment_type !== 'crash_course' && (_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: [_jsx(Calendar, { className: "w-4 h-4 inline mr-1" }), "End Date"] }), _jsx("input", { type: "date", value: formData.end_date, onChange: (e) => handleInputChange('end_date', e.target.value), min: formData.start_date || new Date().toISOString().split('T')[0], max: `${new Date().getFullYear()}-12-31`, className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" }), errors.end_date && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.end_date })] })), formData.assignment_type === 'crash_course' && (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Course Duration" }), _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "number", min: "1", max: "12", value: formData.course_duration_value, onChange: (e) => handleInputChange('course_duration_value', parseInt(e.target.value)), className: "flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", placeholder: "Duration" }), _jsxs("select", { value: formData.course_duration_unit, onChange: (e) => handleInputChange('course_duration_unit', e.target.value), className: "flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "weeks", children: "Weeks" }), _jsx("option", { value: "months", children: "Months" })] })] }), formData.start_date && formData.end_date && (_jsxs("div", { className: "mt-2 p-3 bg-green-50 border border-green-200 rounded-md", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Calendar, { className: "w-4 h-4 text-green-600" }), _jsx("span", { className: "text-sm font-medium text-green-800", children: "Auto-calculated Course Period" })] }), _jsxs("p", { className: "text-sm text-green-700 mt-1", children: [_jsx("strong", { children: "Start:" }), " ", formatDate(formData.start_date), " \u2192 ", _jsx("strong", { children: "End:" }), " ", formatDate(formData.end_date)] }), _jsxs("p", { className: "text-xs text-green-600 mt-1", children: ["End date is automatically calculated as Start Date + ", formData.course_duration_value, " ", formData.course_duration_unit] })] }))] }))] })), formData.assignment_type === 'weekly' && (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Day of Week" }), _jsxs("select", { value: formData.day_of_week, onChange: (e) => handleInputChange('day_of_week', parseInt(e.target.value)), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: 0, children: "Sunday" }), _jsx("option", { value: 1, children: "Monday" }), _jsx("option", { value: 2, children: "Tuesday" }), _jsx("option", { value: 3, children: "Wednesday" }), _jsx("option", { value: 4, children: "Thursday" }), _jsx("option", { value: 5, children: "Friday" }), _jsx("option", { value: 6, children: "Saturday" })] })] })), formData.assignment_type === 'monthly' && (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Day of Month" }), _jsxs("select", { value: formData.day_of_month, onChange: (e) => handleInputChange('day_of_month', parseInt(e.target.value)), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", children: [Array.from({ length: 31 }, (_, i) => i + 1).map(day => (_jsxs("option", { value: day, children: [day, getOrdinalSuffix(day)] }, day))), _jsx("option", { value: -1, children: "Last day of month" })] })] })), formData.assignment_type === 'crash_course' && (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Class Frequency" }), _jsxs("select", { value: formData.class_frequency, onChange: (e) => handleInputChange('class_frequency', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "daily", children: "Daily" }), _jsx("option", { value: "weekly", children: "Weekly" }), _jsx("option", { value: "specific", children: "Specific Days" })] })] })), formData.assignment_type === 'package' && (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Select Package" }), _jsxs("select", { value: formData.package_id, onChange: (e) => handleInputChange('package_id', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "", children: "Select a package" }), _jsx("option", { value: "beginner-yoga-package", children: "Beginner Yoga Package (4 weeks)" }), _jsx("option", { value: "intermediate-yoga-package", children: "Intermediate Yoga Package (6 weeks)" }), _jsx("option", { value: "advanced-yoga-package", children: "Advanced Yoga Package (8 weeks)" })] }), errors.package_id && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.package_id }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: "Package assignments will create classes based on the selected package structure and schedule." })] })), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsx("div", { children: _jsx(ClockSelector, { value: formData.start_time, onChange: handleStartTimeChange, label: "Start Time", error: errors.start_time }) }), _jsx("div", { children: _jsx(ClockSelector, { value: formData.end_time, onChange: handleEndTimeChange, label: "End Time", error: errors.end_time }) }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Duration" }), _jsx("select", { value: formData.duration, onChange: (e) => handleDurationChange(parseInt(e.target.value)), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent", children: getDurationOptions().map(option => (_jsx("option", { value: option.value, children: option.label }, option.value))) }), formData.duration && (_jsxs("p", { className: "text-sm text-gray-600 mt-1", children: ["Duration: ", formData.duration, " minutes"] }))] })] }), conflictWarning?.hasConflict && (_jsxs("div", { className: "bg-red-50 border border-red-200 rounded-md p-4 flex items-start space-x-3", children: [_jsx(AlertTriangle, { className: "w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" }), _jsxs("div", { children: [_jsx("h4", { className: "text-sm font-medium text-red-800", children: "Scheduling Conflict" }), _jsx("p", { className: "text-sm text-red-700 mt-1", children: conflictWarning.message })] })] })), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700", children: ["Instructor / Yoga Acharya", formData.date && formData.start_time && formData.end_time && (_jsxs("span", { className: "text-sm text-gray-500 ml-2", children: ["(", availableInstructors.length, " available)"] }))] }), _jsxs("select", { value: formData.instructor_id, onChange: (e) => handleInputChange('instructor_id', e.target.value), className: "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "", children: "Select instructor" }), availableInstructors.map(profile => (_jsx("option", { value: profile.user_id, children: profile.full_name || profile.email }, profile.user_id)))] }), errors.instructor_id && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.instructor_id }), errors.conflict && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.conflict })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Payment Amount (\u20B9)" }), _jsx("input", { type: "number", min: "0", step: "0.01", value: formData.payment_amount, onChange: (e) => handleInputChange('payment_amount', parseFloat(e.target.value) || 0), className: "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" }), errors.payment_amount && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.payment_amount })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Notes (Optional)" }), _jsx("textarea", { value: formData.notes, onChange: (e) => handleInputChange('notes', e.target.value), className: "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", rows: 3, placeholder: "Add any additional notes..." })] }), _jsxs("div", { className: "flex justify-end space-x-2", children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => {
                                            setShowAssignForm(false);
                                            setConflictWarning(null);
                                        }, children: "Cancel" }), _jsxs(Button, { type: "submit", disabled: saving || conflictWarning?.hasConflict, children: [_jsx(Save, { className: "w-4 h-4 mr-2" }), saving ? 'Saving...' : 'Assign Class'] })] })] })] })), _jsxs("div", { className: "mt-8", children: [_jsx("h3", { className: "text-lg font-semibold mb-4", children: "Assigned Classes" }), loading ? (_jsx("div", { className: "flex justify-center", children: _jsx(LoadingSpinner, { size: "lg" }) })) : (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsxs("th", { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: [_jsx(Calendar, { className: "w-4 h-4 inline mr-1" }), "Date"] }), _jsxs("th", { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: [_jsx(Clock, { className: "w-4 h-4 inline mr-1" }), "Time"] }), _jsx("th", { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Class Type" }), _jsx("th", { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Instructor" }), _jsx("th", { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Status" }), _jsxs("th", { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: [_jsx(DollarSign, { className: "w-4 h-4 inline mr-1" }), "Payment Date"] })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: assignments.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 6, className: "px-4 py-8 text-center text-gray-500", children: "No classes assigned yet" }) })) : (assignments.map(assignment => (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsxs("td", { className: "px-4 py-3 whitespace-nowrap text-sm text-gray-900", children: [_jsx("div", { className: "font-medium", children: formatDate(assignment.date) }), _jsx("div", { className: "text-xs text-gray-500", children: new Date(assignment.date).toLocaleDateString() })] }), _jsxs("td", { className: "px-4 py-3 whitespace-nowrap text-sm text-gray-900", children: [_jsxs("div", { className: "font-medium", children: [formatTime(assignment.start_time), " - ", formatTime(assignment.end_time)] }), _jsx("div", { className: "text-xs text-gray-500", children: assignment.start_time && assignment.end_time ?
                                                            `${timeToMinutes(assignment.end_time) - timeToMinutes(assignment.start_time)} minutes` :
                                                            '—' })] }), _jsx("td", { className: "px-4 py-3 whitespace-nowrap text-sm text-gray-900", children: assignment.class_type?.name || '—' }), _jsx("td", { className: "px-4 py-3 whitespace-nowrap text-sm text-gray-900", children: assignment.instructor_profile?.full_name || assignment.instructor_profile?.email || '—' }), _jsx("td", { className: "px-4 py-3 whitespace-nowrap text-sm", children: _jsxs("select", { value: assignment.payment_status || 'pending', onChange: async (e) => {
                                                        const updated = e.target.value;
                                                        const updateData = { payment_status: updated };
                                                        if (updated === 'paid') {
                                                            updateData.payment_date = new Date().toISOString().split('T')[0];
                                                        }
                                                        else if (updated === 'pending' || updated === 'cancelled') {
                                                            updateData.payment_date = null;
                                                        }
                                                        const { error } = await supabase
                                                            .from('class_assignments')
                                                            .update(updateData)
                                                            .eq('id', assignment.id);
                                                        if (error) {
                                                            console.error('Status update error:', error);
                                                        }
                                                        else {
                                                            fetchData();
                                                        }
                                                    }, className: `text-sm border rounded px-2 py-1 ${assignment.payment_status === 'cancelled' ? 'text-red-600 bg-red-50' :
                                                        assignment.payment_status === 'paid' ? 'text-green-600 bg-green-50' :
                                                            'text-yellow-600 bg-yellow-50'}`, children: [_jsx("option", { value: "pending", children: "Pending" }), _jsx("option", { value: "paid", children: "Paid" }), _jsx("option", { value: "cancelled", children: "Cancelled" })] }) }), _jsx("td", { className: "px-4 py-3 whitespace-nowrap text-sm text-gray-900", children: assignment.payment_date ? new Date(assignment.payment_date).toLocaleDateString() : '—' })] }, assignment.id)))) })] }) }))] })] }));
}
