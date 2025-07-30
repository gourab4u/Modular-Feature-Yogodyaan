import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { AlertTriangle, Calendar, DollarSign, Plus, Save, Users, X, Filter, List, BarChart3, TrendingUp, ChevronDown, Search, Download, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../../../../shared/components/ui/Button';
import ClockSelector from '../../../../shared/components/ui/ClockSelector';
import { LoadingSpinner } from '../../../../shared/components/ui/LoadingSpinner';
import { supabase } from '../../../../shared/lib/supabase';
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
    // Enhanced dashboard state
    const [activeView, setActiveView] = useState('list');
    const [showFilters, setShowFilters] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        dateRange: { start: '', end: '' },
        assignmentTypes: [],
        classStatus: [],
        paymentStatus: [],
        instructors: [],
        classTypes: [],
        packages: []
    });
    // Derived data
    const instructors = userProfiles;
    // Calendar view state
    const getWeekStart = (date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day;
        return new Date(d.setDate(diff));
    };
    const [currentWeekStart, setCurrentWeekStart] = useState(() => getWeekStart(new Date()));
    const [formData, setFormData] = useState({
        // Assignment type selection
        assignment_type: 'adhoc', // 'adhoc', 'weekly', 'monthly', 'crash_course', 'package'
        // Basic fields
        class_type_id: '',
        instructor_id: '',
        payment_amount: 0,
        payment_type: 'per_class', // 'per_class', 'monthly', 'total_duration', 'per_member', 'per_class_total'
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
        // Reset payment_type to per_class if switching away from weekly and weekly-specific payment types were selected
        if (formData.assignment_type !== 'weekly' && (formData.payment_type === 'per_member' || formData.payment_type === 'per_class_total')) {
            setFormData(prev => ({ ...prev, payment_type: 'per_class' }));
        }
    }, [formData.assignment_type, formData.start_date, formData.course_duration_value, formData.course_duration_unit, formData.day_of_week, formData.day_of_month, formData.date]);
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
            case 'package':
                if (formData.package_id) {
                    description = `Package assignment selected - classes will be scheduled based on package structure`;
                }
                else {
                    description = 'Select a package to assign classes based on package structure';
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
        // If a package is selected, multiply by classes per month
        if (formData.package_id) {
            const selectedPackage = packages.find(pkg => pkg.id === formData.package_id);
            if (selectedPackage && selectedPackage.class_count) {
                return Math.max(1, months * selectedPackage.class_count);
            }
        }
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
            const { data: classTypesData } = await supabase.from('class_types').select('id, name, difficulty_level');
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
        // Common validations
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
                if (!formData.class_type_id)
                    newErrors.class_type_id = 'Class type is required';
                if (!formData.date)
                    newErrors.date = 'Date is required';
                break;
            case 'weekly':
                if (!formData.class_type_id)
                    newErrors.class_type_id = 'Class type is required';
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
            payment_type: 'per_class',
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
            class_status: 'active',
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
        // Get the selected package to determine classes per month
        const selectedPackage = packages.find(pkg => pkg.id === formData.package_id);
        const classesPerMonth = selectedPackage?.class_count || 1;
        // Generate all monthly occurrences
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            // Create multiple classes for this month based on package class_count
            for (let classIndex = 0; classIndex < classesPerMonth; classIndex++) {
                // Calculate the actual date for this class in the month
                let classDate = new Date(currentDate);
                if (formData.day_of_month === -1) {
                    // Last day of month
                    classDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
                }
                else {
                    // Specific day of month, but distribute classes throughout the month
                    const baseDay = formData.day_of_month;
                    const dayOffset = Math.floor((classIndex * 7) % 28); // Spread classes weekly within month
                    const targetDay = baseDay + dayOffset;
                    classDate.setDate(Math.min(targetDay, new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()));
                    // If the day doesn't exist in this month, adjust
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
                    payment_amount: formData.payment_amount / classesPerMonth, // Divide payment across classes
                    notes: `Regular Package (Monthly recurring - Class ${classIndex + 1}/${classesPerMonth}): ${formData.notes || 'Auto-generated'}`,
                    schedule_type: 'adhoc',
                    assigned_by: currentUserId,
                    assigned_at: new Date().toISOString(),
                    class_status: 'scheduled',
                    payment_status: 'pending',
                    payment_date: null
                });
            }
            // Move to next month
            currentDate.setMonth(currentDate.getMonth() + 1);
        }
        console.log('Creating monthly assignments:', assignments.length, 'classes', `(${classesPerMonth} classes per month)`);
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
        console.log('Package assignments not yet implemented');
        throw new Error('Package assignments are not yet implemented. Please implement based on your package structure.');
    };
    const availableInstructors = getAvailableInstructors();
    // Filter and search functionality
    const filteredAssignments = assignments.filter(assignment => {
        // Search filter
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = assignment.instructor_profile?.full_name?.toLowerCase().includes(searchLower) ||
                assignment.class_type?.name?.toLowerCase().includes(searchLower) ||
                assignment.notes?.toLowerCase().includes(searchLower);
            if (!matchesSearch)
                return false;
        }
        // Date range filter
        if (filters.dateRange.start && assignment.date < filters.dateRange.start)
            return false;
        if (filters.dateRange.end && assignment.date > filters.dateRange.end)
            return false;
        // Status filters
        if (filters.classStatus.length > 0 && !filters.classStatus.includes(assignment.class_status || 'scheduled'))
            return false;
        if (filters.paymentStatus.length > 0 && !filters.paymentStatus.includes(assignment.payment_status || 'pending'))
            return false;
        // Instructor filter
        if (filters.instructors.length > 0 && !filters.instructors.includes(assignment.instructor_id))
            return false;
        // Class type filter
        if (filters.classTypes.length > 0 && !filters.classTypes.includes(assignment.class_type_id))
            return false;
        // Assignment type filter
        if (filters.assignmentTypes.length > 0) {
            const assignmentType = getAssignmentType(assignment);
            if (!filters.assignmentTypes.includes(assignmentType))
                return false;
        }
        // Package filter - Skip since package_id doesn't exist in ClassAssignment type
        // if (filters.packages.length > 0 && assignment.package_id && !filters.packages.includes(assignment.package_id)) return false
        return true;
    });
    // Calculate statistics
    const stats = {
        totalClasses: filteredAssignments.length,
        scheduledClasses: filteredAssignments.filter(a => a.class_status !== 'cancelled').length,
        completedClasses: filteredAssignments.filter(a => a.class_status === 'completed').length,
        totalRevenue: filteredAssignments.reduce((sum, a) => sum + (a.payment_amount || 0), 0),
        paidRevenue: filteredAssignments.filter(a => a.payment_status === 'paid').reduce((sum, a) => sum + (a.payment_amount || 0), 0),
        pendingRevenue: filteredAssignments.filter(a => a.payment_status === 'pending').reduce((sum, a) => sum + (a.payment_amount || 0), 0),
        activeInstructors: new Set(filteredAssignments.filter(a => a.class_status !== 'cancelled').map(a => a.instructor_id)).size
    };
    // Get assignment type from notes
    const getAssignmentType = (assignment) => {
        if (assignment.notes?.includes('Regular Package'))
            return 'monthly';
        if (assignment.notes?.includes('Crash course'))
            return 'crash_course';
        return 'adhoc';
    };
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx("div", { className: "bg-white shadow-sm border-b", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "flex justify-between items-center py-6", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-2xl font-bold text-gray-900 flex items-center", children: [_jsx(Calendar, { className: "w-6 h-6 mr-3 text-blue-600" }), "Class Assignment Dashboard"] }), _jsx("p", { className: "text-gray-600 mt-1", children: "Manage and visualize all class assignments" })] }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsxs(Button, { variant: "outline", onClick: () => setShowFilters(!showFilters), className: "flex items-center", children: [_jsx(Filter, { className: "w-4 h-4 mr-2" }), "Filters", _jsx(ChevronDown, { className: `w-4 h-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}` })] }), _jsxs(Button, { onClick: () => setShowAssignForm(true), children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), "New Assignment"] })] })] }) }) }), _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6", children: [_jsxs("div", { className: "bg-white rounded-lg shadow-sm p-6 border", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Total Classes" }), _jsx("p", { className: "text-2xl font-bold text-gray-900", children: stats.totalClasses })] }), _jsx("div", { className: "h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center", children: _jsx(Calendar, { className: "h-6 w-6 text-blue-600" }) })] }), _jsx("div", { className: "mt-4 flex items-center text-sm", children: _jsxs("span", { className: "text-green-600 flex items-center", children: [_jsx(TrendingUp, { className: "h-4 w-4 mr-1" }), stats.scheduledClasses, " scheduled"] }) })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-sm p-6 border", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Completed" }), _jsx("p", { className: "text-2xl font-bold text-gray-900", children: stats.completedClasses })] }), _jsx("div", { className: "h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center", children: _jsx(Users, { className: "h-6 w-6 text-green-600" }) })] }), _jsx("div", { className: "mt-4 flex items-center text-sm", children: _jsxs("span", { className: "text-gray-600", children: [stats.totalClasses > 0 ? Math.round((stats.completedClasses / stats.totalClasses) * 100) : 0, "% completion rate"] }) })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-sm p-6 border", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Total Revenue" }), _jsxs("p", { className: "text-2xl font-bold text-gray-900", children: ["\u20B9", stats.totalRevenue.toLocaleString()] })] }), _jsx("div", { className: "h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center", children: _jsx(DollarSign, { className: "h-6 w-6 text-yellow-600" }) })] }), _jsx("div", { className: "mt-4 flex items-center text-sm", children: _jsxs("span", { className: "text-green-600", children: ["\u20B9", stats.paidRevenue.toLocaleString(), " received"] }) })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-sm p-6 border", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Active Instructors" }), _jsx("p", { className: "text-2xl font-bold text-gray-900", children: stats.activeInstructors })] }), _jsx("div", { className: "h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center", children: _jsx(Users, { className: "h-6 w-6 text-purple-600" }) })] }), _jsx("div", { className: "mt-4 flex items-center text-sm", children: _jsxs("span", { className: "text-gray-600", children: [userProfiles.length, " total instructors"] }) })] })] }), showFilters && (_jsxs("div", { className: "bg-white rounded-lg shadow-sm border p-6 mb-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Search" }), _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" }), _jsx("input", { type: "text", placeholder: "Search assignments...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Date Range" }), _jsxs("div", { className: "flex space-x-2", children: [_jsx("input", { type: "date", value: filters.dateRange.start, onChange: (e) => setFilters(prev => ({
                                                            ...prev,
                                                            dateRange: { ...prev.dateRange, start: e.target.value }
                                                        })), className: "flex-1 px-2 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" }), _jsx("input", { type: "date", value: filters.dateRange.end, onChange: (e) => setFilters(prev => ({
                                                            ...prev,
                                                            dateRange: { ...prev.dateRange, end: e.target.value }
                                                        })), className: "flex-1 px-2 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Instructors" }), _jsx("select", { multiple: true, value: filters.instructors, onChange: (e) => setFilters(prev => ({
                                                    ...prev,
                                                    instructors: Array.from(e.target.selectedOptions, option => option.value)
                                                })), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm max-h-20", children: instructors?.map(instructor => (_jsx("option", { value: instructor.user_id, children: instructor.full_name || instructor.email }, instructor.user_id))) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Class Types" }), _jsx("select", { multiple: true, value: filters.classTypes, onChange: (e) => setFilters(prev => ({
                                                    ...prev,
                                                    classTypes: Array.from(e.target.selectedOptions, option => option.value)
                                                })), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm max-h-20", children: classTypes?.map(classType => (_jsx("option", { value: classType.id, children: classType.name }, classType.id))) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Assignment Types" }), _jsxs("select", { multiple: true, value: filters.assignmentTypes, onChange: (e) => setFilters(prev => ({
                                                    ...prev,
                                                    assignmentTypes: Array.from(e.target.selectedOptions, option => option.value)
                                                })), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm", children: [_jsx("option", { value: "adhoc", children: "Ad-hoc" }), _jsx("option", { value: "weekly", children: "Weekly" }), _jsx("option", { value: "monthly", children: "Monthly" }), _jsx("option", { value: "crash_course", children: "Crash Course" }), _jsx("option", { value: "package", children: "Package" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Payment Status" }), _jsxs("select", { multiple: true, value: filters.paymentStatus, onChange: (e) => setFilters(prev => ({
                                                    ...prev,
                                                    paymentStatus: Array.from(e.target.selectedOptions, option => option.value)
                                                })), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm", children: [_jsx("option", { value: "pending", children: "Pending" }), _jsx("option", { value: "paid", children: "Paid" }), _jsx("option", { value: "cancelled", children: "Cancelled" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Class Status" }), _jsxs("select", { multiple: true, value: filters.classStatus, onChange: (e) => setFilters(prev => ({
                                                    ...prev,
                                                    classStatus: Array.from(e.target.selectedOptions, option => option.value)
                                                })), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm", children: [_jsx("option", { value: "scheduled", children: "Scheduled" }), _jsx("option", { value: "completed", children: "Completed" }), _jsx("option", { value: "cancelled", children: "Cancelled" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Packages" }), _jsx("select", { multiple: true, value: filters.packages, onChange: (e) => setFilters(prev => ({
                                                    ...prev,
                                                    packages: Array.from(e.target.selectedOptions, option => option.value)
                                                })), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm max-h-20", children: packages?.map(pkg => (_jsx("option", { value: pkg.id, children: pkg.name }, pkg.id))) })] })] }), _jsxs("div", { className: "mt-4 flex justify-between items-center", children: [_jsxs("div", { className: "flex space-x-2 flex-wrap gap-y-2", children: [searchTerm && (_jsxs("span", { className: "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800", children: ["Search: ", searchTerm, _jsx("button", { onClick: () => setSearchTerm(''), className: "ml-1 text-blue-600 hover:text-blue-800", children: _jsx(X, { className: "h-3 w-3" }) })] })), filters.dateRange.start && (_jsxs("span", { className: "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800", children: ["From: ", filters.dateRange.start, _jsx("button", { onClick: () => setFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, start: '' } })), className: "ml-1 text-green-600 hover:text-green-800", children: _jsx(X, { className: "h-3 w-3" }) })] })), filters.dateRange.end && (_jsxs("span", { className: "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800", children: ["To: ", filters.dateRange.end, _jsx("button", { onClick: () => setFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, end: '' } })), className: "ml-1 text-green-600 hover:text-green-800", children: _jsx(X, { className: "h-3 w-3" }) })] })), filters.instructors.map(instructorId => {
                                                const instructor = instructors?.find(i => i.user_id === instructorId);
                                                return (_jsxs("span", { className: "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800", children: ["Instructor: ", instructor?.full_name || instructor?.email || 'Unknown', _jsx("button", { onClick: () => setFilters(prev => ({ ...prev, instructors: prev.instructors.filter(id => id !== instructorId) })), className: "ml-1 text-purple-600 hover:text-purple-800", children: _jsx(X, { className: "h-3 w-3" }) })] }, instructorId));
                                            }), filters.classTypes.map(classTypeId => {
                                                const classType = classTypes?.find(ct => ct.id === classTypeId);
                                                return (_jsxs("span", { className: "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800", children: ["Class: ", classType?.name || 'Unknown', _jsx("button", { onClick: () => setFilters(prev => ({ ...prev, classTypes: prev.classTypes.filter(id => id !== classTypeId) })), className: "ml-1 text-indigo-600 hover:text-indigo-800", children: _jsx(X, { className: "h-3 w-3" }) })] }, classTypeId));
                                            }), filters.assignmentTypes.map(type => (_jsxs("span", { className: "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800", children: ["Type: ", type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' '), _jsx("button", { onClick: () => setFilters(prev => ({ ...prev, assignmentTypes: prev.assignmentTypes.filter(t => t !== type) })), className: "ml-1 text-yellow-600 hover:text-yellow-800", children: _jsx(X, { className: "h-3 w-3" }) })] }, type))), filters.paymentStatus.map(status => (_jsxs("span", { className: "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800", children: ["Payment: ", status.charAt(0).toUpperCase() + status.slice(1), _jsx("button", { onClick: () => setFilters(prev => ({ ...prev, paymentStatus: prev.paymentStatus.filter(s => s !== status) })), className: "ml-1 text-orange-600 hover:text-orange-800", children: _jsx(X, { className: "h-3 w-3" }) })] }, status))), filters.classStatus.map(status => (_jsxs("span", { className: "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800", children: ["Status: ", status.charAt(0).toUpperCase() + status.slice(1), _jsx("button", { onClick: () => setFilters(prev => ({ ...prev, classStatus: prev.classStatus.filter(s => s !== status) })), className: "ml-1 text-gray-600 hover:text-gray-800", children: _jsx(X, { className: "h-3 w-3" }) })] }, status))), filters.packages.map(packageId => {
                                                const pkg = packages?.find(p => p.id === packageId);
                                                return (_jsxs("span", { className: "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-800", children: ["Package: ", pkg?.name || 'Unknown', _jsx("button", { onClick: () => setFilters(prev => ({ ...prev, packages: prev.packages.filter(id => id !== packageId) })), className: "ml-1 text-pink-600 hover:text-pink-800", children: _jsx(X, { className: "h-3 w-3" }) })] }, packageId));
                                            })] }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => {
                                            setSearchTerm('');
                                            setFilters({
                                                dateRange: { start: '', end: '' },
                                                assignmentTypes: [],
                                                classStatus: [],
                                                paymentStatus: [],
                                                instructors: [],
                                                classTypes: [],
                                                packages: []
                                            });
                                        }, children: "Clear All" })] })] })), _jsxs("div", { className: "bg-white rounded-lg shadow-sm border mb-6", children: [_jsx("div", { className: "border-b border-gray-200", children: _jsxs("nav", { className: "flex space-x-8 px-6", "aria-label": "Tabs", children: [_jsxs("button", { onClick: () => setActiveView('list'), className: `py-4 px-1 border-b-2 font-medium text-sm ${activeView === 'list'
                                                ? 'border-blue-500 text-blue-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`, children: [_jsx(List, { className: "w-4 h-4 inline mr-2" }), "List View"] }), _jsxs("button", { onClick: () => setActiveView('calendar'), className: `py-4 px-1 border-b-2 font-medium text-sm ${activeView === 'calendar'
                                                ? 'border-blue-500 text-blue-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`, children: [_jsx(Calendar, { className: "w-4 h-4 inline mr-2" }), "Calendar View"] }), _jsxs("button", { onClick: () => setActiveView('analytics'), className: `py-4 px-1 border-b-2 font-medium text-sm ${activeView === 'analytics'
                                                ? 'border-blue-500 text-blue-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`, children: [_jsx(BarChart3, { className: "w-4 h-4 inline mr-2" }), "Analytics"] })] }) }), _jsxs("div", { className: "p-6", children: [activeView === 'list' && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("h3", { className: "text-lg font-semibold text-gray-900", children: ["Assignments (", filteredAssignments.length, ")"] }), _jsxs("div", { className: "flex space-x-2", children: [_jsxs(Button, { variant: "outline", size: "sm", children: [_jsx(Download, { className: "w-4 h-4 mr-2" }), "Export"] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: () => fetchData(), children: [_jsx(RefreshCw, { className: "w-4 h-4 mr-2" }), "Refresh"] })] })] }), loading ? (_jsx("div", { className: "flex justify-center py-12", children: _jsx(LoadingSpinner, { size: "lg" }) })) : (_jsx("div", { className: "overflow-hidden", children: filteredAssignments.length === 0 ? (_jsxs("div", { className: "text-center py-12", children: [_jsx(Calendar, { className: "mx-auto h-12 w-12 text-gray-400" }), _jsx("h3", { className: "mt-2 text-sm font-medium text-gray-900", children: "No assignments found" }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Try adjusting your filters or create a new assignment." }), _jsx("div", { className: "mt-6", children: _jsxs(Button, { onClick: () => setShowAssignForm(true), children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), "Create Assignment"] }) })] })) : (_jsx("div", { className: "grid gap-4", children: filteredAssignments.map(assignment => (_jsx("div", { className: "bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("div", { className: `w-3 h-3 rounded-full ${assignment.class_status === 'completed' ? 'bg-green-500' :
                                                                                assignment.class_status === 'cancelled' ? 'bg-red-500' :
                                                                                    'bg-blue-500'}` }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("span", { className: "font-medium text-gray-900", children: formatDate(assignment.date) }), _jsxs("span", { className: "text-sm text-gray-500", children: [formatTime(assignment.start_time), " - ", formatTime(assignment.end_time)] }), _jsx("span", { className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAssignmentType(assignment) === 'crash_course' ? 'bg-orange-100 text-orange-800' :
                                                                                                getAssignmentType(assignment) === 'monthly' ? 'bg-green-100 text-green-800' :
                                                                                                    'bg-blue-100 text-blue-800'}`, children: getAssignmentType(assignment) === 'crash_course' ? 'Crash Course' :
                                                                                                getAssignmentType(assignment) === 'monthly' ? 'Monthly Package' :
                                                                                                    'Adhoc' })] }), _jsxs("div", { className: "flex items-center space-x-4 mt-1", children: [_jsxs("span", { className: "text-sm text-gray-600", children: [_jsx(Users, { className: "w-4 h-4 inline mr-1" }), assignment.instructor_profile?.full_name || 'Unassigned'] }), _jsx("span", { className: "text-sm text-gray-600", children: assignment.class_type?.name || 'No class type' }), _jsxs("span", { className: "text-sm font-medium text-gray-900", children: ["\u20B9", assignment.payment_amount?.toLocaleString()] })] })] })] }), _jsx("div", { className: "flex items-center space-x-3", children: _jsxs("select", { value: assignment.payment_status || 'pending', onChange: async (e) => {
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
                                                                        }, className: `text-xs border rounded px-2 py-1 ${assignment.payment_status === 'cancelled' ? 'text-red-600 bg-red-50 border-red-200' :
                                                                            assignment.payment_status === 'paid' ? 'text-green-600 bg-green-50 border-green-200' :
                                                                                'text-yellow-600 bg-yellow-50 border-yellow-200'}`, children: [_jsx("option", { value: "pending", children: "Pending" }), _jsx("option", { value: "paid", children: "Paid" }), _jsx("option", { value: "cancelled", children: "Cancelled" })] }) })] }) }, assignment.id))) })) }))] })), activeView === 'calendar' && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "Weekly Calendar View" }), _jsxs("div", { className: "flex space-x-2", children: [_jsx("button", { onClick: () => {
                                                                    const currentWeek = new Date(currentWeekStart);
                                                                    currentWeek.setDate(currentWeek.getDate() - 7);
                                                                    setCurrentWeekStart(new Date(currentWeek));
                                                                }, className: "px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md", children: "Previous Week" }), _jsx("button", { onClick: () => setCurrentWeekStart(getWeekStart(new Date())), className: "px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md", children: "Today" }), _jsx("button", { onClick: () => {
                                                                    const currentWeek = new Date(currentWeekStart);
                                                                    currentWeek.setDate(currentWeek.getDate() + 7);
                                                                    setCurrentWeekStart(new Date(currentWeek));
                                                                }, className: "px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md", children: "Next Week" })] })] }), _jsxs("div", { className: "bg-white rounded-lg border shadow-sm overflow-hidden", children: [_jsxs("div", { className: "grid grid-cols-8 border-b bg-gray-50", children: [_jsx("div", { className: "p-3 text-sm font-medium text-gray-700 border-r", children: "Time" }), Array.from({ length: 7 }, (_, i) => {
                                                                const date = new Date(currentWeekStart);
                                                                date.setDate(date.getDate() + i);
                                                                const isToday = date.toDateString() === new Date().toDateString();
                                                                return (_jsxs("div", { className: `p-3 text-center border-r last:border-r-0 ${isToday ? 'bg-blue-50' : ''}`, children: [_jsx("div", { className: `text-sm font-medium ${isToday ? 'text-blue-700' : 'text-gray-700'}`, children: date.toLocaleDateString('en-US', { weekday: 'short' }) }), _jsx("div", { className: `text-lg font-semibold ${isToday ? 'text-blue-700' : 'text-gray-900'}`, children: date.getDate() }), _jsx("div", { className: "text-xs text-gray-500", children: date.toLocaleDateString('en-US', { month: 'short' }) })] }, i));
                                                            })] }), _jsx("div", { className: "max-h-96 overflow-y-auto", children: Array.from({ length: 14 }, (_, hourIndex) => {
                                                            const hour = hourIndex + 8; // Start from 8 AM
                                                            return (_jsxs("div", { className: "grid grid-cols-8 border-b border-gray-100 min-h-[60px]", children: [_jsxs("div", { className: "p-2 text-xs text-gray-500 border-r bg-gray-25 flex items-start", children: [hour, ":00"] }), Array.from({ length: 7 }, (_, dayIndex) => {
                                                                        const date = new Date(currentWeekStart);
                                                                        date.setDate(date.getDate() + dayIndex);
                                                                        const dateString = date.toISOString().split('T')[0];
                                                                        // Find assignments for this day and time slot
                                                                        const dayAssignments = filteredAssignments.filter(assignment => {
                                                                            if (assignment.date !== dateString)
                                                                                return false;
                                                                            if (!assignment.start_time)
                                                                                return false;
                                                                            const startHour = parseInt(assignment.start_time.split(':')[0]);
                                                                            return startHour === hour;
                                                                        });
                                                                        return (_jsx("div", { className: "p-1 border-r last:border-r-0 relative min-h-[60px]", children: dayAssignments.map((assignment, idx) => {
                                                                                const startTime = assignment.start_time || '';
                                                                                const endTime = assignment.end_time || '';
                                                                                const duration = assignment.start_time && assignment.end_time
                                                                                    ? timeToMinutes(assignment.end_time) - timeToMinutes(assignment.start_time)
                                                                                    : 60;
                                                                                return (_jsxs("div", { className: "mb-1 p-1 bg-blue-100 border-l-2 border-blue-500 rounded text-xs cursor-pointer hover:bg-blue-200 transition-colors", style: {
                                                                                        height: `${Math.max(duration / 60 * 60, 20)}px`
                                                                                    }, title: `${assignment.class_type?.name || 'Class'} - ${startTime}-${endTime}\nInstructor: ${assignment.instructor_profile?.full_name || assignment.instructor_profile?.email || 'N/A'}`, children: [_jsx("div", { className: "font-medium text-blue-800 truncate", children: assignment.class_type?.name || 'Class' }), _jsxs("div", { className: "text-blue-600 truncate", children: [startTime, "-", endTime] }), _jsx("div", { className: "text-blue-500 truncate", children: assignment.instructor_profile?.full_name?.split(' ')[0] || 'Instructor' }), assignment.payment_status && (_jsx("div", { className: `text-xs px-1 rounded ${assignment.payment_status === 'paid'
                                                                                                ? 'bg-green-200 text-green-800'
                                                                                                : assignment.payment_status === 'pending'
                                                                                                    ? 'bg-yellow-200 text-yellow-800'
                                                                                                    : 'bg-red-200 text-red-800'}`, children: assignment.payment_status }))] }, idx));
                                                                            }) }, dayIndex));
                                                                    })] }, hour));
                                                        }) })] }), _jsxs("div", { className: "flex flex-wrap gap-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-3 h-3 bg-blue-100 border-l-2 border-blue-500 rounded" }), _jsx("span", { children: "Scheduled Classes" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-3 h-3 bg-green-200 rounded" }), _jsx("span", { children: "Paid" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-3 h-3 bg-yellow-200 rounded" }), _jsx("span", { children: "Pending Payment" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-3 h-3 bg-red-200 rounded" }), _jsx("span", { children: "Cancelled" })] })] })] })), activeView === 'analytics' && (_jsxs("div", { className: "space-y-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "Analytics & Insights" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-gray-50 rounded-lg p-6", children: [_jsx("h4", { className: "text-md font-medium text-gray-900 mb-4", children: "Assignment Types" }), _jsx("div", { className: "space-y-3", children: [
                                                                    { type: 'adhoc', label: 'Adhoc Classes', color: 'bg-blue-500' },
                                                                    { type: 'monthly', label: 'Monthly Packages', color: 'bg-green-500' },
                                                                    { type: 'crash_course', label: 'Crash Courses', color: 'bg-orange-500' }
                                                                ].map(({ type, label, color }) => {
                                                                    const count = filteredAssignments.filter(a => getAssignmentType(a) === type).length;
                                                                    const percentage = filteredAssignments.length > 0 ? (count / filteredAssignments.length) * 100 : 0;
                                                                    return (_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: `w-3 h-3 rounded-full ${color} mr-3` }), _jsx("span", { className: "text-sm text-gray-700", children: label })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("span", { className: "text-sm font-medium", children: count }), _jsxs("span", { className: "text-xs text-gray-500", children: ["(", percentage.toFixed(1), "%)"] })] })] }, type));
                                                                }) })] }), _jsxs("div", { className: "bg-gray-50 rounded-lg p-6", children: [_jsx("h4", { className: "text-md font-medium text-gray-900 mb-4", children: "Revenue Status" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "w-3 h-3 rounded-full bg-green-500 mr-3" }), _jsx("span", { className: "text-sm text-gray-700", children: "Paid" })] }), _jsxs("span", { className: "text-sm font-medium", children: ["\u20B9", stats.paidRevenue.toLocaleString()] })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "w-3 h-3 rounded-full bg-yellow-500 mr-3" }), _jsx("span", { className: "text-sm text-gray-700", children: "Pending" })] }), _jsxs("span", { className: "text-sm font-medium", children: ["\u20B9", stats.pendingRevenue.toLocaleString()] })] })] })] })] })] }))] })] })] }), showAssignForm && (_jsx("div", { className: "fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4", children: _jsxs("div", { className: "bg-white shadow-xl rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto", children: [_jsxs("div", { className: "flex justify-between items-center p-6 border-b border-gray-200", children: [_jsx("h3", { className: "text-xl font-semibold text-gray-900", children: "Create New Assignment" }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => {
                                        setShowAssignForm(false);
                                        setConflictWarning(null);
                                    }, children: _jsx(X, { className: "w-4 h-4" }) })] }), _jsxs("form", { onSubmit: handleSubmit, className: "p-6 space-y-6", children: [errors.general && _jsx("div", { className: "text-red-500 text-sm", children: errors.general }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Assignment Type" }), _jsxs("select", { value: formData.assignment_type, onChange: (e) => handleInputChange('assignment_type', e.target.value), className: "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "adhoc", children: "Adhoc Class (One-time class with selectable date)" }), _jsx("option", { value: "weekly", children: "Weekly Recurring (Recurring weekly classes till end date)" }), _jsx("option", { value: "monthly", children: "Regular Packages (Monthly recurring packages)" }), _jsx("option", { value: "crash_course", children: "Crash Course (Fixed duration course with auto-calculated end date)" })] }), errors.assignment_type && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.assignment_type })] }), formData.timeline_description && (_jsxs("div", { className: "bg-blue-50 border border-blue-200 rounded-lg p-4", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx(Calendar, { className: "w-4 h-4 text-blue-600" }), _jsx("span", { className: "font-medium text-blue-800", children: "Assignment Timeline" })] }), _jsx("p", { className: "text-blue-700", children: formData.timeline_description }), formData.total_classes > 0 && (_jsxs("p", { className: "text-sm text-blue-600 mt-1", children: ["Total estimated classes: ", formData.total_classes] }))] })), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: formData.assignment_type === 'crash_course' ? 'Crash Course Package' :
                                                formData.assignment_type === 'monthly' ? 'Regular Package' :
                                                    'Class Type' }), _jsxs("select", { value: (formData.assignment_type === 'crash_course' || formData.assignment_type === 'monthly') ? formData.package_id : formData.class_type_id, onChange: (e) => {
                                                if (formData.assignment_type === 'crash_course' || formData.assignment_type === 'monthly') {
                                                    handleInputChange('package_id', e.target.value);
                                                    handleInputChange('class_type_id', ''); // Clear class_type_id when using package
                                                }
                                                else {
                                                    handleInputChange('class_type_id', e.target.value);
                                                    handleInputChange('package_id', ''); // Clear package_id when using class type
                                                }
                                            }, className: "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "", children: formData.assignment_type === 'crash_course' ? 'Select crash course package' :
                                                        formData.assignment_type === 'monthly' ? 'Select regular package' :
                                                            'Select class type' }), formData.assignment_type === 'crash_course'
                                                    ? packages.filter(pkg => pkg.course_type === 'crash').map(pkg => (_jsxs("option", { value: pkg.id, children: [pkg.name, " - ", pkg.type || 'Standard', " (", pkg.duration, " - ", pkg.class_count, " classes - \u20B9", pkg.price, ")"] }, pkg.id)))
                                                    : formData.assignment_type === 'monthly'
                                                        ? packages.filter(pkg => pkg.course_type === 'regular').map(pkg => (_jsxs("option", { value: pkg.id, children: [pkg.name, " - ", pkg.type || 'Standard', " (", pkg.duration, " - ", pkg.class_count, " classes - \u20B9", pkg.price, ")"] }, pkg.id)))
                                                        : classTypes.map(ct => (_jsxs("option", { value: ct.id, children: [ct.name, " (", ct.difficulty_level, ")"] }, ct.id)))] }), errors.class_type_id && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.class_type_id }), errors.package_id && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.package_id }), formData.package_id && (formData.assignment_type === 'crash_course' || formData.assignment_type === 'monthly') && (() => {
                                            const selectedPkg = packages.find(pkg => pkg.id === formData.package_id);
                                            return selectedPkg && (_jsx("div", { className: `mt-2 p-3 border rounded-md ${formData.assignment_type === 'crash_course'
                                                    ? 'bg-blue-50 border-blue-200'
                                                    : 'bg-green-50 border-green-200'}`, children: _jsxs("div", { className: `text-sm ${formData.assignment_type === 'crash_course'
                                                        ? 'text-blue-800'
                                                        : 'text-green-800'}`, children: [_jsx("div", { className: "flex items-center gap-2 mb-1", children: _jsx("span", { className: "font-medium", children: "Package Details:" }) }), _jsxs("div", { className: "grid grid-cols-2 gap-2 text-xs", children: [_jsxs("div", { children: [_jsx("strong", { children: "Type:" }), " ", selectedPkg.type || 'Standard'] }), _jsxs("div", { children: [_jsx("strong", { children: "Duration:" }), " ", selectedPkg.duration] }), _jsxs("div", { children: [_jsx("strong", { children: "Classes:" }), " ", selectedPkg.class_count] }), _jsxs("div", { children: [_jsx("strong", { children: "Price:" }), " \u20B9", selectedPkg.price] }), selectedPkg.validity_days && _jsxs("div", { children: [_jsx("strong", { children: "Validity:" }), " ", selectedPkg.validity_days, " days"] }), selectedPkg.description && _jsxs("div", { className: "col-span-2", children: [_jsx("strong", { children: "Description:" }), " ", selectedPkg.description] })] })] }) }));
                                        })()] }), formData.assignment_type === 'adhoc' && (_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: [_jsx(Calendar, { className: "w-4 h-4 inline mr-1" }), "Class Date"] }), _jsx("input", { type: "date", value: formData.date, onChange: (e) => handleInputChange('date', e.target.value), min: new Date().toISOString().split('T')[0], className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" }), errors.date && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.date })] })), (formData.assignment_type === 'weekly' || formData.assignment_type === 'monthly' || formData.assignment_type === 'crash_course') && (_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: [_jsx(Calendar, { className: "w-4 h-4 inline mr-1" }), "Start Date"] }), _jsx("input", { type: "date", value: formData.start_date, onChange: (e) => handleInputChange('start_date', e.target.value), min: new Date().toISOString().split('T')[0], className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" }), errors.start_date && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.start_date })] }), formData.assignment_type !== 'crash_course' && (_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: [_jsx(Calendar, { className: "w-4 h-4 inline mr-1" }), "End Date"] }), _jsx("input", { type: "date", value: formData.end_date, onChange: (e) => handleInputChange('end_date', e.target.value), min: formData.start_date || new Date().toISOString().split('T')[0], max: `${new Date().getFullYear()}-12-31`, className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" }), errors.end_date && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.end_date })] })), formData.assignment_type === 'crash_course' && (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Course Duration" }), _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "number", min: "1", max: "12", value: formData.course_duration_value, onChange: (e) => handleInputChange('course_duration_value', parseInt(e.target.value)), className: "flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", placeholder: "Duration" }), _jsxs("select", { value: formData.course_duration_unit, onChange: (e) => handleInputChange('course_duration_unit', e.target.value), className: "flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "weeks", children: "Weeks" }), _jsx("option", { value: "months", children: "Months" })] })] }), formData.start_date && formData.end_date && (_jsxs("div", { className: "mt-2 p-3 bg-green-50 border border-green-200 rounded-md", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Calendar, { className: "w-4 h-4 text-green-600" }), _jsx("span", { className: "text-sm font-medium text-green-800", children: "Auto-calculated Course Period" })] }), _jsxs("p", { className: "text-sm text-green-700 mt-1", children: [_jsx("strong", { children: "Start:" }), " ", formatDate(formData.start_date), " \u2192 ", _jsx("strong", { children: "End:" }), " ", formatDate(formData.end_date)] }), _jsxs("p", { className: "text-xs text-green-600 mt-1", children: ["End date is automatically calculated as Start Date + ", formData.course_duration_value, " ", formData.course_duration_unit] })] }))] }))] })), formData.assignment_type === 'weekly' && (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Day of Week" }), _jsxs("select", { value: formData.day_of_week, onChange: (e) => handleInputChange('day_of_week', parseInt(e.target.value)), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: 0, children: "Sunday" }), _jsx("option", { value: 1, children: "Monday" }), _jsx("option", { value: 2, children: "Tuesday" }), _jsx("option", { value: 3, children: "Wednesday" }), _jsx("option", { value: 4, children: "Thursday" }), _jsx("option", { value: 5, children: "Friday" }), _jsx("option", { value: 6, children: "Saturday" })] })] })), formData.assignment_type === 'monthly' && (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Day of Month" }), _jsxs("select", { value: formData.day_of_month, onChange: (e) => handleInputChange('day_of_month', parseInt(e.target.value)), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", children: [Array.from({ length: 31 }, (_, i) => i + 1).map(day => (_jsxs("option", { value: day, children: [day, getOrdinalSuffix(day)] }, day))), _jsx("option", { value: -1, children: "Last day of month" })] })] })), formData.assignment_type === 'crash_course' && (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Class Frequency" }), _jsxs("select", { value: formData.class_frequency, onChange: (e) => handleInputChange('class_frequency', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "daily", children: "Daily" }), _jsx("option", { value: "weekly", children: "Weekly" }), _jsx("option", { value: "specific", children: "Specific Days" })] })] })), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsx("div", { children: _jsx(ClockSelector, { value: formData.start_time, onChange: handleStartTimeChange, label: "Start Time", error: errors.start_time }) }), _jsx("div", { children: _jsx(ClockSelector, { value: formData.end_time, onChange: handleEndTimeChange, label: "End Time", error: errors.end_time }) }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Duration" }), _jsx("select", { value: formData.duration, onChange: (e) => handleDurationChange(parseInt(e.target.value)), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent", children: getDurationOptions().map(option => (_jsx("option", { value: option.value, children: option.label }, option.value))) }), formData.duration && (_jsxs("p", { className: "text-sm text-gray-600 mt-1", children: ["Duration: ", formData.duration, " minutes"] }))] })] }), conflictWarning?.hasConflict && (_jsxs("div", { className: "bg-red-50 border border-red-200 rounded-md p-4 flex items-start space-x-3", children: [_jsx(AlertTriangle, { className: "w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" }), _jsxs("div", { children: [_jsx("h4", { className: "text-sm font-medium text-red-800", children: "Scheduling Conflict" }), _jsx("p", { className: "text-sm text-red-700 mt-1", children: conflictWarning.message })] })] })), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700", children: ["Instructor / Yoga Acharya", formData.date && formData.start_time && formData.end_time && (_jsxs("span", { className: "text-sm text-gray-500 ml-2", children: ["(", availableInstructors.length, " available)"] }))] }), _jsxs("select", { value: formData.instructor_id, onChange: (e) => handleInputChange('instructor_id', e.target.value), className: "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "", children: "Select instructor" }), availableInstructors.map(profile => (_jsx("option", { value: profile.user_id, children: profile.full_name || profile.email }, profile.user_id)))] }), errors.instructor_id && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.instructor_id }), errors.conflict && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.conflict })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Payment Type" }), _jsxs("select", { value: formData.payment_type, onChange: (e) => handleInputChange('payment_type', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "per_class", children: "Per Class" }), _jsx("option", { value: "monthly", children: "Monthly" }), _jsx("option", { value: "total_duration", children: "Total Duration" }), formData.assignment_type === 'weekly' && (_jsxs(_Fragment, { children: [_jsx("option", { value: "per_member", children: "Per Student Monthly Rate (Weekly Classes)" }), _jsx("option", { value: "per_class_total", children: "Total Per Class (Weekly Classes)" })] }))] })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: ["Payment Amount (\u20B9)", _jsxs("span", { className: "text-sm text-gray-500 ml-1", children: [formData.payment_type === 'per_class' && '(per class)', formData.payment_type === 'monthly' && '(per month)', formData.payment_type === 'total_duration' && '(total amount)', formData.payment_type === 'per_member' && '(per student monthly rate)', formData.payment_type === 'per_class_total' && '(total per class)'] })] }), _jsx("input", { type: "number", min: "0", step: "0.01", value: formData.payment_amount, onChange: (e) => handleInputChange('payment_amount', parseFloat(e.target.value) || 0), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", placeholder: formData.payment_type === 'per_class' ? 'Amount per class' :
                                                        formData.payment_type === 'monthly' ? 'Monthly payment amount' :
                                                            formData.payment_type === 'per_member' ? 'Rate per student per month' :
                                                                formData.payment_type === 'per_class_total' ? 'Total amount per class' :
                                                                    'Total course amount' }), errors.payment_amount && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.payment_amount })] })] }), formData.total_classes > 0 && formData.payment_amount > 0 && (_jsxs("div", { className: "bg-gray-50 border border-gray-200 rounded-lg p-4", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx(DollarSign, { className: "w-4 h-4 text-gray-600" }), _jsx("span", { className: "font-medium text-gray-800", children: "Payment Summary" })] }), _jsxs("div", { className: "text-sm text-gray-700", children: [formData.payment_type === 'per_class' && (_jsxs("p", { children: [_jsx("strong", { children: "Per Class:" }), " \u20B9", formData.payment_amount, " \u00D7 ", formData.total_classes, " classes =", _jsxs("span", { className: "font-semibold text-green-600 ml-1", children: ["\u20B9", (formData.payment_amount * formData.total_classes).toLocaleString()] })] })), formData.payment_type === 'monthly' && (_jsxs("p", { children: [_jsx("strong", { children: "Monthly:" }), " \u20B9", formData.payment_amount, " per month \u00D7 estimated ", Math.ceil(formData.total_classes / 4), " months =", _jsxs("span", { className: "font-semibold text-green-600 ml-1", children: ["\u20B9", (formData.payment_amount * Math.ceil(formData.total_classes / 4)).toLocaleString()] })] })), formData.payment_type === 'total_duration' && (_jsxs("p", { children: [_jsx("strong", { children: "Total Duration:" }), _jsxs("span", { className: "font-semibold text-green-600 ml-1", children: ["\u20B9", formData.payment_amount.toLocaleString()] }), ' ', "for entire course (", formData.total_classes, " classes)"] })), formData.payment_type === 'per_member' && (_jsxs("div", { children: [_jsxs("p", { children: [_jsx("strong", { children: "Per Student Monthly Rate:" }), " \u20B9", formData.payment_amount, " per student per month"] }), _jsxs("div", { className: "mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs", children: [_jsx("p", { className: "text-blue-700", children: _jsx("strong", { children: "Monthly Payment Calculation:" }) }), _jsx("p", { className: "text-blue-800 font-medium", children: "Formula: Students enrolled \u00D7 Monthly rate \u00D7 Weekly classes in month" }), _jsxs("div", { className: "mt-2 space-y-1", children: [_jsxs("p", { className: "text-blue-600", children: ["\u2022 ", _jsx("strong", { children: "Month 1:" }), " 5 students \u00D7 \u20B9", formData.payment_amount, " \u00D7 4 weeks = ", _jsxs("span", { className: "font-semibold", children: ["\u20B9", (formData.payment_amount * 5 * 4).toLocaleString()] })] }), _jsxs("p", { className: "text-blue-600", children: ["\u2022 ", _jsx("strong", { children: "Month 2:" }), " 7 students \u00D7 \u20B9", formData.payment_amount, " \u00D7 4 weeks = ", _jsxs("span", { className: "font-semibold", children: ["\u20B9", (formData.payment_amount * 7 * 4).toLocaleString()] })] }), _jsxs("p", { className: "text-blue-600", children: ["\u2022 ", _jsx("strong", { children: "Month 3:" }), " 10 students \u00D7 \u20B9", formData.payment_amount, " \u00D7 4 weeks = ", _jsxs("span", { className: "font-semibold", children: ["\u20B9", (formData.payment_amount * 10 * 4).toLocaleString()] })] })] }), _jsx("p", { className: "text-blue-500 text-xs mt-2", children: "* Payment calculated monthly based on enrolled students that month" })] })] })), formData.payment_type === 'per_class_total' && (_jsxs("div", { children: [_jsxs("p", { children: [_jsx("strong", { children: "Total Per Class:" }), " \u20B9", formData.payment_amount, " per class (fixed amount)"] }), _jsxs("div", { className: "mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs", children: [_jsx("p", { className: "text-orange-700", children: _jsx("strong", { children: "Fixed Class Payment:" }) }), _jsxs("p", { className: "text-orange-600", children: ["\u2022 Instructor receives \u20B9", formData.payment_amount.toLocaleString(), " per class regardless of attendance"] }), _jsxs("p", { className: "text-orange-600", children: ["\u2022 Total for ", formData.total_classes, " classes: ", _jsxs("span", { className: "font-semibold", children: ["\u20B9", (formData.payment_amount * formData.total_classes).toLocaleString()] })] }), _jsx("p", { className: "text-orange-500 text-xs mt-1", children: "* Payment is fixed per class, independent of member count" })] })] }))] })] })), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Notes (Optional)" }), _jsx("textarea", { value: formData.notes, onChange: (e) => handleInputChange('notes', e.target.value), className: "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", rows: 3, placeholder: "Add any additional notes..." })] }), _jsxs("div", { className: "flex justify-end space-x-2", children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => {
                                                setShowAssignForm(false);
                                                setConflictWarning(null);
                                            }, children: "Cancel" }), _jsxs(Button, { type: "submit", disabled: saving || conflictWarning?.hasConflict, children: [_jsx(Save, { className: "w-4 h-4 mr-2" }), saving ? 'Saving...' : 'Assign Class'] })] })] })] }) }))] }));
}
export default ClassAssignmentManager;
