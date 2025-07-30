import { AlertTriangle, Calendar, DollarSign, Plus, Save, Users, X, Filter, List, BarChart3, TrendingUp, ChevronDown, Search, Download, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '../../../../shared/components/ui/Button'
import ClockSelector from '../../../../shared/components/ui/ClockSelector'
import { LoadingSpinner } from '../../../../shared/components/ui/LoadingSpinner'
import { supabase } from '../../../../shared/lib/supabase'

interface ClassAssignment {
    id: string
    class_type_id: string
    date: string
    start_time: string | null
    end_time: string | null
    instructor_id: string
    payment_amount: number
    notes?: string
    class_status?: 'scheduled' | 'completed' | 'cancelled'
    payment_status?: 'pending' | 'paid' | 'cancelled'
    payment_date?: string
    assigned_at: string
    assigned_by: string
    schedule_type: string
    class_type?: {
        id: string
        name: string
        difficulty_level: string
    }
    instructor_profile?: {
        user_id: string
        full_name: string
        email: string
    }
}

interface ClassSchedule {
    id: string
    class_type_id: string
    day_of_week: number // 0 = Sunday, 1 = Monday, etc.
    start_time: string
    end_time: string
    instructor_id: string
    is_active?: boolean
    class_type?: {
        id: string
        name: string
        difficulty_level: string
    }
    instructor_profile?: {
        user_id: string
        full_name: string
        email: string
    }
}

interface UserProfile {
    user_id: string
    full_name: string
    email: string
    user_roles: {
        roles: {
            name: string
        }
    }[]
}

interface ConflictDetails {
    hasConflict: boolean
    conflictingClass?: ClassAssignment | ClassSchedule
    message?: string
}

export function ClassAssignmentManager() {
    const [assignments, setAssignments] = useState<ClassAssignment[]>([])
    const [weeklySchedules, setWeeklySchedules] = useState<ClassSchedule[]>([])
    const [classTypes, setClassTypes] = useState<any[]>([])
    const [packages, setPackages] = useState<any[]>([])
    const [userProfiles, setUserProfiles] = useState<UserProfile[]>([])
    const [loading, setLoading] = useState(true)
    const [showAssignForm, setShowAssignForm] = useState(false)
    const [saving, setSaving] = useState(false)
    const [errors, setErrors] = useState<any>({})
    const [conflictWarning, setConflictWarning] = useState<ConflictDetails | null>(null)

    // Enhanced dashboard state
    const [activeView, setActiveView] = useState<'list' | 'calendar' | 'analytics'>('list')
    const [showFilters, setShowFilters] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [filters, setFilters] = useState({
        dateRange: { start: '', end: '' },
        assignmentTypes: [] as string[],
        classStatus: [] as string[],
        paymentStatus: [] as string[],
        instructors: [] as string[],
        classTypes: [] as string[],
        packages: [] as string[]
    })

    // Derived data
    const instructors = userProfiles

    // Calendar view state
    const getWeekStart = (date: Date) => {
        const d = new Date(date)
        const day = d.getDay()
        const diff = d.getDate() - day
        return new Date(d.setDate(diff))
    }
    
    const [currentWeekStart, setCurrentWeekStart] = useState(() => getWeekStart(new Date()))

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
    })

    useEffect(() => {
        fetchData()
    }, [])

    // Auto-calculate end dates and timeline descriptions when relevant fields change
    useEffect(() => {
        updateTimelineInfo()

        // Reset payment_type to per_class if switching away from weekly and weekly-specific payment types were selected
        if (formData.assignment_type !== 'weekly' && (formData.payment_type === 'per_member' || formData.payment_type === 'per_class_total')) {
            setFormData(prev => ({ ...prev, payment_type: 'per_class' }))
        }
    }, [formData.assignment_type, formData.start_date, formData.course_duration_value, formData.course_duration_unit, formData.day_of_week, formData.day_of_month, formData.date])

    const updateTimelineInfo = () => {
        let description = ''
        let calculatedEndDate = ''
        let totalClasses = 0

        switch (formData.assignment_type) {
            case 'adhoc':
                description = formData.date ? `One-time adhoc class on ${formatDate(formData.date)}` : 'Select date for one-time adhoc class'
                totalClasses = 1
                break

            case 'weekly':
                if (formData.start_date && formData.end_date) {
                    const dayName = getDayName(formData.day_of_week)
                    description = `Recurring weekly ${dayName} classes from ${formatDate(formData.start_date)} recurring till ${formatDate(formData.end_date)}`
                    totalClasses = calculateWeeklyClasses(formData.start_date, formData.end_date)
                } else if (formData.start_date) {
                    const dayName = getDayName(formData.day_of_week)
                    description = `Recurring weekly ${dayName} classes starting ${formatDate(formData.start_date)} - select end date (till end of year)`
                } else {
                    description = 'Set up recurring weekly schedule with start date and recurring till date'
                }
                break

            case 'monthly':
                if (formData.start_date && formData.end_date) {
                    const dayDesc = formData.day_of_month === -1 ? 'last day' : `${formData.day_of_month}${getOrdinalSuffix(formData.day_of_month)}`
                    description = `Monthly recurring on ${dayDesc} of each month from ${formatDate(formData.start_date)} recurring till ${formatDate(formData.end_date)}`
                    totalClasses = calculateMonthlyClasses(formData.start_date, formData.end_date)
                } else if (formData.start_date) {
                    const dayDesc = formData.day_of_month === -1 ? 'last day' : `${formData.day_of_month}${getOrdinalSuffix(formData.day_of_month)}`
                    description = `Monthly recurring on ${dayDesc} starting ${formatDate(formData.start_date)} - select end date (till end of year)`
                } else {
                    description = 'Set up monthly recurring classes with start date and recurring till date'
                }
                break

            case 'crash_course':
                if (formData.start_date) {
                    calculatedEndDate = calculateCourseEndDate(formData.start_date, formData.course_duration_value, formData.course_duration_unit)
                    description = `Crash course: ${formData.course_duration_value} ${formData.course_duration_unit} duration. Start Date: ${formatDate(formData.start_date)} → End Date: ${formatDate(calculatedEndDate)} (Auto-calculated)`
                    totalClasses = calculateCourseClasses(formData.course_duration_value, formData.course_duration_unit, formData.class_frequency)

                    // Auto-set end date
                    if (calculatedEndDate !== formData.end_date) {
                        setFormData(prev => ({ ...prev, end_date: calculatedEndDate }))
                    }
                } else {
                    description = `Set up crash course: ${formData.course_duration_value} ${formData.course_duration_unit} duration (end date will be auto-calculated)`
                }
                break

            case 'package':
                if (formData.package_id) {
                    description = `Package assignment selected - classes will be scheduled based on package structure`
                } else {
                    description = 'Select a package to assign classes based on package structure'
                }
                break

            default:
                description = 'Select assignment type to see timeline preview'
        }

        setFormData(prev => ({
            ...prev,
            timeline_description: description,
            total_classes: totalClasses
        }))
    }

    const calculateCourseEndDate = (startDate: string, duration: number, unit: string) => {
        const start = new Date(startDate)
        const end = new Date(start)

        if (unit === 'weeks') {
            end.setDate(start.getDate() + (duration * 7))
        } else if (unit === 'months') {
            end.setMonth(start.getMonth() + duration)
        }

        return end.toISOString().split('T')[0]
    }

    const calculateWeeklyClasses = (startDate: string, endDate: string) => {
        const start = new Date(startDate)
        const end = new Date(endDate)
        const weeks = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7))
        return Math.max(1, weeks)
    }

    const calculateMonthlyClasses = (startDate: string, endDate: string) => {
        const start = new Date(startDate)
        const end = new Date(endDate)
        const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1
        
        // If a package is selected, multiply by classes per month
        if (formData.package_id) {
            const selectedPackage = packages.find(pkg => pkg.id === formData.package_id)
            if (selectedPackage && selectedPackage.class_count) {
                return Math.max(1, months * selectedPackage.class_count)
            }
        }
        
        return Math.max(1, months)
    }

    const calculateCourseClasses = (duration: number, unit: string, frequency: string) => {
        const totalWeeks = unit === 'weeks' ? duration : duration * 4 // Approximate weeks

        switch (frequency) {
            case 'daily':
                return totalWeeks * 7
            case 'weekly':
                return totalWeeks
            default:
                return totalWeeks // Default to weekly
        }
    }

    const getDayName = (dayOfWeek: number) => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        return days[dayOfWeek]
    }

    const getOrdinalSuffix = (day: number) => {
        if (day > 3 && day < 21) return 'th'
        switch (day % 10) {
            case 1: return 'st'
            case 2: return 'nd'
            case 3: return 'rd'
            default: return 'th'
        }
    }

    // Check for scheduling conflicts when relevant fields change
    useEffect(() => {
        if (formData.instructor_id && formData.date && formData.start_time && formData.end_time) {
            checkForConflicts()
        } else {
            setConflictWarning(null)
        }
    }, [formData.instructor_id, formData.date, formData.start_time, formData.end_time])

    const fetchData = async () => {
        try {
            setLoading(true)

            const { data: classTypesData } = await supabase.from('class_types').select('id, name, difficulty_level')
            const { data: packagesData } = await supabase.from('class_packages').select('id, name, description, duration, price, class_count, validity_days, type, course_type').eq('is_active', true).eq('is_archived', false)
            const { data: roles } = await supabase
                .from('roles')
                .select('id, name')
                .in('name', ['instructor', 'yoga_acharya'])

            const roleIds = roles?.map(r => r.id) || []
            const { data: userRoles } = await supabase
                .from('user_roles')
                .select('user_id, role_id')
                .in('role_id', roleIds)

            const userIds = [...new Set(userRoles?.map(ur => ur.user_id) || [])]
            const { data: profiles } = await supabase
                .from('profiles')
                .select('user_id, full_name, email')
                .in('user_id', userIds)

            const profilesWithRoles = (profiles || []).map(profile => {
                const userRoleIds = (userRoles || []).filter(ur => ur.user_id === profile.user_id).map(ur => ur.role_id)
                const profileRoles = (roles || []).filter(role => userRoleIds.includes(role.id)).map(role => ({ roles: { name: role.name } }))
                return {
                    ...profile,
                    user_roles: profileRoles
                }
            })

            // Fetch all assignments (all are now 'adhoc' in schedule_type, differentiated by package_id vs class_type_id)
            const { data: assignmentsData } = await supabase
                .from('class_assignments')
                .select('*')
                .eq('schedule_type', 'adhoc')
                .order('assigned_at', { ascending: false })

            // Fetch weekly schedules
            const { data: weeklySchedulesData } = await supabase
                .from('class_schedules')
                .select('*')
                .eq('is_active', true)
                .order('day_of_week', { ascending: true })

            const enrichedAssignments = (assignmentsData || []).map(assignment => {
                const classType = classTypesData?.find(ct => ct.id === assignment.class_type_id)
                const instructorProfile = profilesWithRoles.find(p => p.user_id === assignment.instructor_id)
                return {
                    ...assignment,
                    class_type: classType,
                    instructor_profile: instructorProfile
                }
            })

            const enrichedWeeklySchedules = (weeklySchedulesData || []).map(schedule => {
                const classType = classTypesData?.find(ct => ct.id === schedule.class_type_id)
                const instructorProfile = profilesWithRoles.find(p => p.user_id === schedule.instructor_id)
                return {
                    ...schedule,
                    class_type: classType,
                    instructor_profile: instructorProfile
                }
            })

            setClassTypes(classTypesData || [])
            setPackages(packagesData || [])
            setUserProfiles(profilesWithRoles)
            setAssignments(enrichedAssignments)
            setWeeklySchedules(enrichedWeeklySchedules)
        } catch (e) {
            console.error('Fetch error:', e)
        } finally {
            setLoading(false)
        }
    }

    const checkForConflicts = () => {
        if (!formData.instructor_id || !formData.date || !formData.start_time || !formData.end_time) {
            setConflictWarning(null)
            return
        }

        const proposedStart = timeToMinutes(formData.start_time)
        const proposedEnd = timeToMinutes(formData.end_time)
        const proposedDate = new Date(formData.date)
        const proposedDayOfWeek = proposedDate.getDay() // 0 = Sunday, 1 = Monday, etc.

        // Check for conflicts with existing adhoc assignments
        const conflictingAssignment = assignments.find(assignment => {
            // Only check assignments that are not cancelled
            if (assignment.class_status === 'cancelled') return false

            // Check if same instructor and same date
            if (assignment.instructor_id === formData.instructor_id && assignment.date === formData.date) {
                if (assignment.start_time && assignment.end_time) {
                    const existingStart = timeToMinutes(assignment.start_time)
                    const existingEnd = timeToMinutes(assignment.end_time)

                    // Check if times overlap
                    return (proposedStart < existingEnd && proposedEnd > existingStart)
                }
            }
            return false
        })

        // Check for conflicts with weekly schedules
        const conflictingWeeklySchedule = weeklySchedules.find(schedule => {
            // Only check active schedules
            if (!schedule.is_active) return false

            // Check if same instructor and same day of week
            if (schedule.instructor_id === formData.instructor_id && schedule.day_of_week === proposedDayOfWeek) {
                if (schedule.start_time && schedule.end_time) {
                    const existingStart = timeToMinutes(schedule.start_time)
                    const existingEnd = timeToMinutes(schedule.end_time)

                    // Check if times overlap
                    return (proposedStart < existingEnd && proposedEnd > existingStart)
                }
            }
            return false
        })

        const instructor = userProfiles.find(p => p.user_id === formData.instructor_id)

        if (conflictingAssignment) {
            const conflictTime = `${formatTime(conflictingAssignment.start_time)} - ${formatTime(conflictingAssignment.end_time)}`

            setConflictWarning({
                hasConflict: true,
                conflictingClass: conflictingAssignment,
                message: `${instructor?.full_name || 'This instructor'} already has an adhoc class scheduled from ${conflictTime} on ${formatDate(formData.date)}`
            })
        } else if (conflictingWeeklySchedule) {
            const conflictTime = `${formatTime(conflictingWeeklySchedule.start_time)} - ${formatTime(conflictingWeeklySchedule.end_time)}`
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
            const dayName = dayNames[proposedDayOfWeek]

            setConflictWarning({
                hasConflict: true,
                conflictingClass: conflictingWeeklySchedule as any, // Type assertion since we're reusing the interface
                message: `${instructor?.full_name || 'This instructor'} has a weekly recurring class scheduled from ${conflictTime} every ${dayName}`
            })
        } else {
            setConflictWarning(null)
        }
    }

    const getAvailableInstructors = () => {
        if (!formData.date || !formData.start_time || !formData.end_time) {
            return userProfiles
        }

        const proposedStart = timeToMinutes(formData.start_time)
        const proposedEnd = timeToMinutes(formData.end_time)
        const proposedDate = new Date(formData.date)
        const proposedDayOfWeek = proposedDate.getDay()

        return userProfiles.filter(instructor => {
            // Check for conflicts with adhoc assignments
            const hasAdhocConflict = assignments.some(assignment => {
                if (assignment.class_status === 'cancelled') return false

                if (assignment.instructor_id === instructor.user_id && assignment.date === formData.date) {
                    if (assignment.start_time && assignment.end_time) {
                        const existingStart = timeToMinutes(assignment.start_time)
                        const existingEnd = timeToMinutes(assignment.end_time)
                        return (proposedStart < existingEnd && proposedEnd > existingStart)
                    }
                }
                return false
            })

            // Check for conflicts with weekly schedules
            const hasWeeklyConflict = weeklySchedules.some(schedule => {
                if (!schedule.is_active) return false

                if (schedule.instructor_id === instructor.user_id && schedule.day_of_week === proposedDayOfWeek) {
                    if (schedule.start_time && schedule.end_time) {
                        const existingStart = timeToMinutes(schedule.start_time)
                        const existingEnd = timeToMinutes(schedule.end_time)
                        return (proposedStart < existingEnd && proposedEnd > existingStart)
                    }
                }
                return false
            })

            return !hasAdhocConflict && !hasWeeklyConflict
        })
    }

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        if (errors[field]) {
            setErrors((prev: any) => ({ ...prev, [field]: '' }))
        }
    }

    // Helper function to convert time to minutes
    const timeToMinutes = (timeString: string) => {
        if (!timeString) return 0;
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    }

    // Helper function to convert minutes to time string
    const minutesToTime = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }

    const handleStartTimeChange = (time: string) => {
        handleInputChange('start_time', time);

        // If we have a duration, calculate end time
        if (formData.duration > 0) {
            const startMinutes = timeToMinutes(time);
            const endMinutes = startMinutes + formData.duration;
            const endTime = minutesToTime(endMinutes);
            handleInputChange('end_time', endTime);
        }
    }

    const handleEndTimeChange = (time: string) => {
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
    }

    const handleDurationChange = (durationMinutes: number) => {
        handleInputChange('duration', durationMinutes);

        // If we have a start time, calculate end time
        if (formData.start_time) {
            const startMinutes = timeToMinutes(formData.start_time);
            const endMinutes = startMinutes + durationMinutes;
            const endTime = minutesToTime(endMinutes);
            handleInputChange('end_time', endTime);
        }
    }

    const validateForm = () => {
        const newErrors: any = {}

        // Common validations
        if (!formData.instructor_id) newErrors.instructor_id = 'Instructor is required'
        if (!formData.start_time) newErrors.start_time = 'Start time is required'
        if (!formData.end_time) newErrors.end_time = 'End time is required'
        if (formData.payment_amount <= 0) newErrors.payment_amount = 'Amount must be greater than 0'

        // Assignment type specific validations
        switch (formData.assignment_type) {
            case 'adhoc':
                if (!formData.class_type_id) newErrors.class_type_id = 'Class type is required'
                if (!formData.date) newErrors.date = 'Date is required'
                break

            case 'weekly':
                if (!formData.class_type_id) newErrors.class_type_id = 'Class type is required'
                if (!formData.start_date) newErrors.start_date = 'Start date is required'
                if (!formData.end_date) newErrors.end_date = 'End date is required'
                if (formData.start_date && formData.end_date && formData.start_date >= formData.end_date) {
                    newErrors.end_date = 'End date must be after start date'
                }
                break

            case 'monthly':
                if (!formData.package_id) newErrors.package_id = 'Package is required'
                if (!formData.start_date) newErrors.start_date = 'Start date is required'
                if (!formData.end_date) newErrors.end_date = 'End date is required'
                if (formData.start_date && formData.end_date && formData.start_date >= formData.end_date) {
                    newErrors.end_date = 'End date must be after start date'
                }
                break

            case 'crash_course':
                if (!formData.package_id) newErrors.package_id = 'Package is required'
                if (!formData.start_date) newErrors.start_date = 'Start date is required'
                if (formData.course_duration_value < 1) newErrors.course_duration_value = 'Duration must be at least 1'
                break
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
            newErrors.conflict = 'Please resolve the scheduling conflict before proceeding'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const getDurationOptions = () => [
        { value: 30, label: '30 minutes' },
        { value: 60, label: '1 hour' },
        { value: 90, label: '1 hour 30 minutes' },
        { value: 120, label: '2 hours' }
    ]

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        const today = new Date()
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        if (date.toDateString() === today.toDateString()) {
            return 'Today'
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return 'Tomorrow'
        } else {
            return date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            })
        }
    }

    const formatTime = (timeString: string | null) => {
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
        } catch (error) {
            console.error('Error formatting time:', timeString, error);
            return '—';
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateForm()) return

        try {
            setSaving(true)
            const currentUser = await supabase.auth.getUser()
            const currentUserId = currentUser.data.user?.id || ''

            switch (formData.assignment_type) {
                case 'adhoc':
                    await createAdhocAssignment(currentUserId)
                    break

                case 'weekly':
                    await createWeeklySchedule(currentUserId)
                    break

                case 'monthly':
                    await createMonthlyAssignments(currentUserId)
                    break

                case 'crash_course':
                    await createCrashCourseAssignments(currentUserId)
                    break

                case 'package':
                    await createPackageAssignments(currentUserId)
                    break

                default:
                    throw new Error('Invalid assignment type')
            }

            await fetchData()
            setShowAssignForm(false)
            resetForm()
            setConflictWarning(null)
            alert(`${formData.assignment_type.replace('_', ' ')} assignment created successfully`)
        } catch (err: any) {
            console.error('Submit error:', err)
            setErrors({ general: err.message })
        } finally {
            setSaving(false)
        }
    }

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
        })
    }

    const createAdhocAssignment = async (currentUserId: string) => {
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
            class_status: 'scheduled' as const,
            payment_status: 'pending' as const,
            payment_date: null
        }

        console.log('Creating adhoc assignment:', assignment)
        const { error } = await supabase.from('class_assignments').insert([assignment])
        if (error) {
            console.error('Adhoc assignment creation error:', error)
            throw error
        }
    }

    const createWeeklySchedule = async (currentUserId: string) => {
        const schedule = {
            class_type_id: formData.class_type_id,
            instructor_id: formData.instructor_id,
            day_of_week: formData.day_of_week,
            start_time: formData.start_time,
            end_time: formData.end_time,
            duration_minutes: formData.duration,
            class_status: 'active' as const,
            created_by: currentUserId,
            created_at: new Date().toISOString(),
            is_active: true,
            start_date: formData.start_date,
            end_date: formData.end_date,
            notes: `Weekly recurring class: ${formData.notes || 'Auto-generated schedule'}`
        }

        console.log('Creating weekly schedule:', schedule)
        const { error } = await supabase.from('class_schedules').insert([schedule])
        if (error) {
            console.error('Weekly schedule creation error:', error)
            throw error
        }
    }

    const createMonthlyAssignments = async (currentUserId: string) => {
        const assignments = []
        const startDate = new Date(formData.start_date)
        const endDate = new Date(formData.end_date)

        // Get the selected package to determine classes per month
        const selectedPackage = packages.find(pkg => pkg.id === formData.package_id)
        const classesPerMonth = selectedPackage?.class_count || 1

        // Generate all monthly occurrences
        const currentDate = new Date(startDate)
        while (currentDate <= endDate) {
            // Create multiple classes for this month based on package class_count
            for (let classIndex = 0; classIndex < classesPerMonth; classIndex++) {
                // Calculate the actual date for this class in the month
                let classDate = new Date(currentDate)

                if (formData.day_of_month === -1) {
                    // Last day of month
                    classDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
                } else {
                    // Specific day of month, but distribute classes throughout the month
                    const baseDay = formData.day_of_month
                    const dayOffset = Math.floor((classIndex * 7) % 28) // Spread classes weekly within month
                    const targetDay = baseDay + dayOffset
                    
                    classDate.setDate(Math.min(targetDay, new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()))

                    // If the day doesn't exist in this month, adjust
                    if (classDate.getMonth() !== currentDate.getMonth()) {
                        classDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
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
                    class_status: 'scheduled' as const,
                    payment_status: 'pending' as const,
                    payment_date: null
                })
            }

            // Move to next month
            currentDate.setMonth(currentDate.getMonth() + 1)
        }

        console.log('Creating monthly assignments:', assignments.length, 'classes', `(${classesPerMonth} classes per month)`)
        const { error } = await supabase.from('class_assignments').insert(assignments)
        if (error) {
            console.error('Monthly assignments creation error:', error)
            throw error
        }
    }

    const createCrashCourseAssignments = async (currentUserId: string) => {
        const assignments = []
        const startDate = new Date(formData.start_date)
        const endDate = new Date(formData.end_date)

        // Generate class dates based on frequency
        const classDates = []
        const currentDate = new Date(startDate)

        while (currentDate <= endDate) {
            classDates.push(new Date(currentDate))

            if (formData.class_frequency === 'daily') {
                currentDate.setDate(currentDate.getDate() + 1)
            } else if (formData.class_frequency === 'weekly') {
                currentDate.setDate(currentDate.getDate() + 7)
            } else if (formData.class_frequency === 'specific') {
                // TODO: Implement specific days logic based on formData.specific_days
                currentDate.setDate(currentDate.getDate() + 7) // Default to weekly for now
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
                class_status: 'scheduled' as const,
                payment_status: 'pending' as const,
                payment_date: null
            })
        }

        console.log('Creating crash course assignments:', assignments.length, 'classes')
        const { error } = await supabase.from('class_assignments').insert(assignments)
        if (error) {
            console.error('Crash course assignments creation error:', error)
            throw error
        }
    }

    const createPackageAssignments = async (_currentUserId: string) => {
        // TODO: Implement package assignment logic
        console.log('Package assignments not yet implemented')
        throw new Error('Package assignments are not yet implemented. Please implement based on your package structure.')
    }

    const availableInstructors = getAvailableInstructors()

    // Filter and search functionality
    const filteredAssignments = assignments.filter(assignment => {
        // Search filter
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase()
            const matchesSearch =
                assignment.instructor_profile?.full_name?.toLowerCase().includes(searchLower) ||
                assignment.class_type?.name?.toLowerCase().includes(searchLower) ||
                assignment.notes?.toLowerCase().includes(searchLower)
            if (!matchesSearch) return false
        }

        // Date range filter
        if (filters.dateRange.start && assignment.date < filters.dateRange.start) return false
        if (filters.dateRange.end && assignment.date > filters.dateRange.end) return false

        // Status filters
        if (filters.classStatus.length > 0 && !filters.classStatus.includes(assignment.class_status || 'scheduled')) return false
        if (filters.paymentStatus.length > 0 && !filters.paymentStatus.includes(assignment.payment_status || 'pending')) return false

        // Instructor filter
        if (filters.instructors.length > 0 && !filters.instructors.includes(assignment.instructor_id)) return false

        // Class type filter
        if (filters.classTypes.length > 0 && !filters.classTypes.includes(assignment.class_type_id)) return false

        // Assignment type filter
        if (filters.assignmentTypes.length > 0) {
            const assignmentType = getAssignmentType(assignment)
            if (!filters.assignmentTypes.includes(assignmentType)) return false
        }

        // Package filter - Skip since package_id doesn't exist in ClassAssignment type
        // if (filters.packages.length > 0 && assignment.package_id && !filters.packages.includes(assignment.package_id)) return false

        return true
    })

    // Calculate statistics
    const stats = {
        totalClasses: filteredAssignments.length,
        scheduledClasses: filteredAssignments.filter(a => a.class_status !== 'cancelled').length,
        completedClasses: filteredAssignments.filter(a => a.class_status === 'completed').length,
        totalRevenue: filteredAssignments.reduce((sum, a) => sum + (a.payment_amount || 0), 0),
        paidRevenue: filteredAssignments.filter(a => a.payment_status === 'paid').reduce((sum, a) => sum + (a.payment_amount || 0), 0),
        pendingRevenue: filteredAssignments.filter(a => a.payment_status === 'pending').reduce((sum, a) => sum + (a.payment_amount || 0), 0),
        activeInstructors: new Set(filteredAssignments.filter(a => a.class_status !== 'cancelled').map(a => a.instructor_id)).size
    }

    // Get assignment type from notes
    const getAssignmentType = (assignment: ClassAssignment) => {
        if (assignment.notes?.includes('Regular Package')) return 'monthly'
        if (assignment.notes?.includes('Crash course')) return 'crash_course'
        return 'adhoc'
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Section */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                                <Calendar className="w-6 h-6 mr-3 text-blue-600" />
                                Class Assignment Dashboard
                            </h1>
                            <p className="text-gray-600 mt-1">Manage and visualize all class assignments</p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Button
                                variant="outline"
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex items-center"
                            >
                                <Filter className="w-4 h-4 mr-2" />
                                Filters
                                <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                            </Button>
                            <Button onClick={() => setShowAssignForm(true)}>
                                <Plus className="w-4 h-4 mr-2" />
                                New Assignment
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <div className="bg-white rounded-lg shadow-sm p-6 border">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Classes</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.totalClasses}</p>
                            </div>
                            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Calendar className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm">
                            <span className="text-green-600 flex items-center">
                                <TrendingUp className="h-4 w-4 mr-1" />
                                {stats.scheduledClasses} scheduled
                            </span>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6 border">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Completed</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.completedClasses}</p>
                            </div>
                            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <Users className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm">
                            <span className="text-gray-600">
                                {stats.totalClasses > 0 ? Math.round((stats.completedClasses / stats.totalClasses) * 100) : 0}% completion rate
                            </span>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6 border">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                                <p className="text-2xl font-bold text-gray-900">₹{stats.totalRevenue.toLocaleString()}</p>
                            </div>
                            <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <DollarSign className="h-6 w-6 text-yellow-600" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm">
                            <span className="text-green-600">
                                ₹{stats.paidRevenue.toLocaleString()} received
                            </span>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6 border">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Active Instructors</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.activeInstructors}</p>
                            </div>
                            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Users className="h-6 w-6 text-purple-600" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm">
                            <span className="text-gray-600">
                                {userProfiles.length} total instructors
                            </span>
                        </div>
                    </div>
                </div>

                {/* Filters Panel */}
                {showFilters && (
                    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {/* Search */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <input
                                        type="text"
                                        placeholder="Search assignments..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Date Range */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                                <div className="flex space-x-2">
                                    <input
                                        type="date"
                                        value={filters.dateRange.start}
                                        onChange={(e) => setFilters(prev => ({
                                            ...prev,
                                            dateRange: { ...prev.dateRange, start: e.target.value }
                                        }))}
                                        className="flex-1 px-2 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <input
                                        type="date"
                                        value={filters.dateRange.end}
                                        onChange={(e) => setFilters(prev => ({
                                            ...prev,
                                            dateRange: { ...prev.dateRange, end: e.target.value }
                                        }))}
                                        className="flex-1 px-2 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Instructors */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Instructors</label>
                                <select
                                    multiple
                                    value={filters.instructors}
                                    onChange={(e) => setFilters(prev => ({
                                        ...prev,
                                        instructors: Array.from(e.target.selectedOptions, option => option.value)
                                    }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm max-h-20"
                                >
                                    {instructors?.map(instructor => (
                                        <option key={instructor.user_id} value={instructor.user_id}>
                                            {instructor.full_name || instructor.email}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Class Types */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Class Types</label>
                                <select
                                    multiple
                                    value={filters.classTypes}
                                    onChange={(e) => setFilters(prev => ({
                                        ...prev,
                                        classTypes: Array.from(e.target.selectedOptions, option => option.value)
                                    }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm max-h-20"
                                >
                                    {classTypes?.map(classType => (
                                        <option key={classType.id} value={classType.id}>
                                            {classType.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Assignment Types */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Assignment Types</label>
                                <select
                                    multiple
                                    value={filters.assignmentTypes}
                                    onChange={(e) => setFilters(prev => ({
                                        ...prev,
                                        assignmentTypes: Array.from(e.target.selectedOptions, option => option.value)
                                    }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                >
                                    <option value="adhoc">Ad-hoc</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="crash_course">Crash Course</option>
                                    <option value="package">Package</option>
                                </select>
                            </div>

                            {/* Payment Status */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
                                <select
                                    multiple
                                    value={filters.paymentStatus}
                                    onChange={(e) => setFilters(prev => ({
                                        ...prev,
                                        paymentStatus: Array.from(e.target.selectedOptions, option => option.value)
                                    }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                >
                                    <option value="pending">Pending</option>
                                    <option value="paid">Paid</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>

                            {/* Class Status */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Class Status</label>
                                <select
                                    multiple
                                    value={filters.classStatus}
                                    onChange={(e) => setFilters(prev => ({
                                        ...prev,
                                        classStatus: Array.from(e.target.selectedOptions, option => option.value)
                                    }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                >
                                    <option value="scheduled">Scheduled</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>

                            {/* Packages */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Packages</label>
                                <select
                                    multiple
                                    value={filters.packages}
                                    onChange={(e) => setFilters(prev => ({
                                        ...prev,
                                        packages: Array.from(e.target.selectedOptions, option => option.value)
                                    }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm max-h-20"
                                >
                                    {packages?.map(pkg => (
                                        <option key={pkg.id} value={pkg.id}>
                                            {pkg.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Active Filter Tags */}
                        <div className="mt-4 flex justify-between items-center">
                            <div className="flex space-x-2 flex-wrap gap-y-2">
                                {searchTerm && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        Search: {searchTerm}
                                        <button onClick={() => setSearchTerm('')} className="ml-1 text-blue-600 hover:text-blue-800">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                )}
                                {filters.dateRange.start && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        From: {filters.dateRange.start}
                                        <button onClick={() => setFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, start: '' } }))} className="ml-1 text-green-600 hover:text-green-800">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                )}
                                {filters.dateRange.end && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        To: {filters.dateRange.end}
                                        <button onClick={() => setFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, end: '' } }))} className="ml-1 text-green-600 hover:text-green-800">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                )}
                                {filters.instructors.map(instructorId => {
                                    const instructor = instructors?.find(i => i.user_id === instructorId)
                                    return (
                                        <span key={instructorId} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                            Instructor: {instructor?.full_name || instructor?.email || 'Unknown'}
                                            <button onClick={() => setFilters(prev => ({ ...prev, instructors: prev.instructors.filter(id => id !== instructorId) }))} className="ml-1 text-purple-600 hover:text-purple-800">
                                                <X className="h-3 w-3" />
                                            </button>
                                        </span>
                                    )
                                })}
                                {filters.classTypes.map(classTypeId => {
                                    const classType = classTypes?.find(ct => ct.id === classTypeId)
                                    return (
                                        <span key={classTypeId} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                            Class: {classType?.name || 'Unknown'}
                                            <button onClick={() => setFilters(prev => ({ ...prev, classTypes: prev.classTypes.filter(id => id !== classTypeId) }))} className="ml-1 text-indigo-600 hover:text-indigo-800">
                                                <X className="h-3 w-3" />
                                            </button>
                                        </span>
                                    )
                                })}
                                {filters.assignmentTypes.map(type => (
                                    <span key={type} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                        Type: {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                                        <button onClick={() => setFilters(prev => ({ ...prev, assignmentTypes: prev.assignmentTypes.filter(t => t !== type) }))} className="ml-1 text-yellow-600 hover:text-yellow-800">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                ))}
                                {filters.paymentStatus.map(status => (
                                    <span key={status} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                        Payment: {status.charAt(0).toUpperCase() + status.slice(1)}
                                        <button onClick={() => setFilters(prev => ({ ...prev, paymentStatus: prev.paymentStatus.filter(s => s !== status) }))} className="ml-1 text-orange-600 hover:text-orange-800">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                ))}
                                {filters.classStatus.map(status => (
                                    <span key={status} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                        Status: {status.charAt(0).toUpperCase() + status.slice(1)}
                                        <button onClick={() => setFilters(prev => ({ ...prev, classStatus: prev.classStatus.filter(s => s !== status) }))} className="ml-1 text-gray-600 hover:text-gray-800">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                ))}
                                {filters.packages.map(packageId => {
                                    const pkg = packages?.find(p => p.id === packageId)
                                    return (
                                        <span key={packageId} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                                            Package: {pkg?.name || 'Unknown'}
                                            <button onClick={() => setFilters(prev => ({ ...prev, packages: prev.packages.filter(id => id !== packageId) }))} className="ml-1 text-pink-600 hover:text-pink-800">
                                                <X className="h-3 w-3" />
                                            </button>
                                        </span>
                                    )
                                })}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setSearchTerm('')
                                    setFilters({
                                        dateRange: { start: '', end: '' },
                                        assignmentTypes: [],
                                        classStatus: [],
                                        paymentStatus: [],
                                        instructors: [],
                                        classTypes: [],
                                        packages: []
                                    })
                                }}
                            >
                                Clear All
                            </Button>
                        </div>
                    </div>
                )}

                {/* View Tabs */}
                <div className="bg-white rounded-lg shadow-sm border mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="flex space-x-8 px-6" aria-label="Tabs">
                            <button
                                onClick={() => setActiveView('list')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeView === 'list'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                <List className="w-4 h-4 inline mr-2" />
                                List View
                            </button>
                            <button
                                onClick={() => setActiveView('calendar')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeView === 'calendar'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                <Calendar className="w-4 h-4 inline mr-2" />
                                Calendar View
                            </button>
                            <button
                                onClick={() => setActiveView('analytics')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeView === 'analytics'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                <BarChart3 className="w-4 h-4 inline mr-2" />
                                Analytics
                            </button>
                        </nav>
                    </div>

                    {/* View Content */}
                    <div className="p-6">
                        {activeView === 'list' && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Assignments ({filteredAssignments.length})
                                    </h3>
                                    <div className="flex space-x-2">
                                        <Button variant="outline" size="sm">
                                            <Download className="w-4 h-4 mr-2" />
                                            Export
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => fetchData()}>
                                            <RefreshCw className="w-4 h-4 mr-2" />
                                            Refresh
                                        </Button>
                                    </div>
                                </div>

                                {/* Enhanced List View */}
                                {loading ? (
                                    <div className="flex justify-center py-12">
                                        <LoadingSpinner size="lg" />
                                    </div>
                                ) : (
                                    <div className="overflow-hidden">
                                        {filteredAssignments.length === 0 ? (
                                            <div className="text-center py-12">
                                                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                                                <h3 className="mt-2 text-sm font-medium text-gray-900">No assignments found</h3>
                                                <p className="mt-1 text-sm text-gray-500">Try adjusting your filters or create a new assignment.</p>
                                                <div className="mt-6">
                                                    <Button onClick={() => setShowAssignForm(true)}>
                                                        <Plus className="w-4 h-4 mr-2" />
                                                        Create Assignment
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="grid gap-4">
                                                {filteredAssignments.map(assignment => (
                                                    <div key={assignment.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center space-x-4">
                                                                <div className={`w-3 h-3 rounded-full ${assignment.class_status === 'completed' ? 'bg-green-500' :
                                                                        assignment.class_status === 'cancelled' ? 'bg-red-500' :
                                                                            'bg-blue-500'
                                                                    }`} />
                                                                <div>
                                                                    <div className="flex items-center space-x-2">
                                                                        <span className="font-medium text-gray-900">
                                                                            {formatDate(assignment.date)}
                                                                        </span>
                                                                        <span className="text-sm text-gray-500">
                                                                            {formatTime(assignment.start_time)} - {formatTime(assignment.end_time)}
                                                                        </span>
                                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAssignmentType(assignment) === 'crash_course' ? 'bg-orange-100 text-orange-800' :
                                                                                getAssignmentType(assignment) === 'monthly' ? 'bg-green-100 text-green-800' :
                                                                                    'bg-blue-100 text-blue-800'
                                                                            }`}>
                                                                            {getAssignmentType(assignment) === 'crash_course' ? 'Crash Course' :
                                                                                getAssignmentType(assignment) === 'monthly' ? 'Monthly Package' :
                                                                                    'Adhoc'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center space-x-4 mt-1">
                                                                        <span className="text-sm text-gray-600">
                                                                            <Users className="w-4 h-4 inline mr-1" />
                                                                            {assignment.instructor_profile?.full_name || 'Unassigned'}
                                                                        </span>
                                                                        <span className="text-sm text-gray-600">
                                                                            {assignment.class_type?.name || 'No class type'}
                                                                        </span>
                                                                        <span className="text-sm font-medium text-gray-900">
                                                                            ₹{assignment.payment_amount?.toLocaleString()}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center space-x-3">
                                                                <select
                                                                    value={assignment.payment_status || 'pending'}
                                                                    onChange={async (e) => {
                                                                        const updated = e.target.value;
                                                                        const updateData: any = { payment_status: updated };
                                                                        if (updated === 'paid') {
                                                                            updateData.payment_date = new Date().toISOString().split('T')[0];
                                                                        } else if (updated === 'pending' || updated === 'cancelled') {
                                                                            updateData.payment_date = null;
                                                                        }

                                                                        const { error } = await supabase
                                                                            .from('class_assignments')
                                                                            .update(updateData)
                                                                            .eq('id', assignment.id);

                                                                        if (error) {
                                                                            console.error('Status update error:', error);
                                                                        } else {
                                                                            fetchData();
                                                                        }
                                                                    }}
                                                                    className={`text-xs border rounded px-2 py-1 ${assignment.payment_status === 'cancelled' ? 'text-red-600 bg-red-50 border-red-200' :
                                                                            assignment.payment_status === 'paid' ? 'text-green-600 bg-green-50 border-green-200' :
                                                                                'text-yellow-600 bg-yellow-50 border-yellow-200'
                                                                        }`}
                                                                >
                                                                    <option value="pending">Pending</option>
                                                                    <option value="paid">Paid</option>
                                                                    <option value="cancelled">Cancelled</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeView === 'calendar' && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold text-gray-900">Weekly Calendar View</h3>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => {
                                                const currentWeek = new Date(currentWeekStart)
                                                currentWeek.setDate(currentWeek.getDate() - 7)
                                                setCurrentWeekStart(new Date(currentWeek))
                                            }}
                                            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
                                        >
                                            Previous Week
                                        </button>
                                        <button
                                            onClick={() => setCurrentWeekStart(getWeekStart(new Date()))}
                                            className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md"
                                        >
                                            Today
                                        </button>
                                        <button
                                            onClick={() => {
                                                const currentWeek = new Date(currentWeekStart)
                                                currentWeek.setDate(currentWeek.getDate() + 7)
                                                setCurrentWeekStart(new Date(currentWeek))
                                            }}
                                            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
                                        >
                                            Next Week
                                        </button>
                                    </div>
                                </div>

                                {/* Calendar Grid */}
                                <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                                    {/* Week Header */}
                                    <div className="grid grid-cols-8 border-b bg-gray-50">
                                        <div className="p-3 text-sm font-medium text-gray-700 border-r">Time</div>
                                        {Array.from({ length: 7 }, (_, i) => {
                                            const date = new Date(currentWeekStart)
                                            date.setDate(date.getDate() + i)
                                            const isToday = date.toDateString() === new Date().toDateString()
                                            return (
                                                <div key={i} className={`p-3 text-center border-r last:border-r-0 ${isToday ? 'bg-blue-50' : ''}`}>
                                                    <div className={`text-sm font-medium ${isToday ? 'text-blue-700' : 'text-gray-700'}`}>
                                                        {date.toLocaleDateString('en-US', { weekday: 'short' })}
                                                    </div>
                                                    <div className={`text-lg font-semibold ${isToday ? 'text-blue-700' : 'text-gray-900'}`}>
                                                        {date.getDate()}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {date.toLocaleDateString('en-US', { month: 'short' })}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>

                                    {/* Calendar Body */}
                                    <div className="max-h-96 overflow-y-auto">
                                        {Array.from({ length: 14 }, (_, hourIndex) => {
                                            const hour = hourIndex + 8 // Start from 8 AM
                                            return (
                                                <div key={hour} className="grid grid-cols-8 border-b border-gray-100 min-h-[60px]">
                                                    {/* Time Column */}
                                                    <div className="p-2 text-xs text-gray-500 border-r bg-gray-25 flex items-start">
                                                        {hour}:00
                                                    </div>
                                                    
                                                    {/* Day Columns */}
                                                    {Array.from({ length: 7 }, (_, dayIndex) => {
                                                        const date = new Date(currentWeekStart)
                                                        date.setDate(date.getDate() + dayIndex)
                                                        const dateString = date.toISOString().split('T')[0]
                                                        
                                                        // Find assignments for this day and time slot
                                                        const dayAssignments = filteredAssignments.filter(assignment => {
                                                            if (assignment.date !== dateString) return false
                                                            if (!assignment.start_time) return false
                                                            
                                                            const startHour = parseInt(assignment.start_time.split(':')[0])
                                                            return startHour === hour
                                                        })

                                                        return (
                                                            <div key={dayIndex} className="p-1 border-r last:border-r-0 relative min-h-[60px]">
                                                                {dayAssignments.map((assignment, idx) => {
                                                                    const startTime = assignment.start_time || ''
                                                                    const endTime = assignment.end_time || ''
                                                                    const duration = assignment.start_time && assignment.end_time 
                                                                        ? timeToMinutes(assignment.end_time) - timeToMinutes(assignment.start_time)
                                                                        : 60
                                                                    
                                                                    return (
                                                                        <div
                                                                            key={idx}
                                                                            className="mb-1 p-1 bg-blue-100 border-l-2 border-blue-500 rounded text-xs cursor-pointer hover:bg-blue-200 transition-colors"
                                                                            style={{ 
                                                                                height: `${Math.max(duration / 60 * 60, 20)}px`
                                                                            }}
                                                                            title={`${assignment.class_type?.name || 'Class'} - ${startTime}-${endTime}\nInstructor: ${assignment.instructor_profile?.full_name || assignment.instructor_profile?.email || 'N/A'}`}
                                                                        >
                                                                            <div className="font-medium text-blue-800 truncate">
                                                                                {assignment.class_type?.name || 'Class'}
                                                                            </div>
                                                                            <div className="text-blue-600 truncate">
                                                                                {startTime}-{endTime}
                                                                            </div>
                                                                            <div className="text-blue-500 truncate">
                                                                                {assignment.instructor_profile?.full_name?.split(' ')[0] || 'Instructor'}
                                                                            </div>
                                                                            {assignment.payment_status && (
                                                                                <div className={`text-xs px-1 rounded ${
                                                                                    assignment.payment_status === 'paid' 
                                                                                        ? 'bg-green-200 text-green-800' 
                                                                                        : assignment.payment_status === 'pending'
                                                                                        ? 'bg-yellow-200 text-yellow-800'
                                                                                        : 'bg-red-200 text-red-800'
                                                                                }`}>
                                                                                    {assignment.payment_status}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )
                                                                })}
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Calendar Legend */}
                                <div className="flex flex-wrap gap-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-blue-100 border-l-2 border-blue-500 rounded"></div>
                                        <span>Scheduled Classes</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-green-200 rounded"></div>
                                        <span>Paid</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-yellow-200 rounded"></div>
                                        <span>Pending Payment</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-red-200 rounded"></div>
                                        <span>Cancelled</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeView === 'analytics' && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold text-gray-900">Analytics & Insights</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Assignment Type Distribution */}
                                    <div className="bg-gray-50 rounded-lg p-6">
                                        <h4 className="text-md font-medium text-gray-900 mb-4">Assignment Types</h4>
                                        <div className="space-y-3">
                                            {[
                                                { type: 'adhoc', label: 'Adhoc Classes', color: 'bg-blue-500' },
                                                { type: 'monthly', label: 'Monthly Packages', color: 'bg-green-500' },
                                                { type: 'crash_course', label: 'Crash Courses', color: 'bg-orange-500' }
                                            ].map(({ type, label, color }) => {
                                                const count = filteredAssignments.filter(a => getAssignmentType(a) === type).length
                                                const percentage = filteredAssignments.length > 0 ? (count / filteredAssignments.length) * 100 : 0
                                                return (
                                                    <div key={type} className="flex items-center justify-between">
                                                        <div className="flex items-center">
                                                            <div className={`w-3 h-3 rounded-full ${color} mr-3`} />
                                                            <span className="text-sm text-gray-700">{label}</span>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <span className="text-sm font-medium">{count}</span>
                                                            <span className="text-xs text-gray-500">({percentage.toFixed(1)}%)</span>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    {/* Revenue Breakdown */}
                                    <div className="bg-gray-50 rounded-lg p-6">
                                        <h4 className="text-md font-medium text-gray-900 mb-4">Revenue Status</h4>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <div className="w-3 h-3 rounded-full bg-green-500 mr-3" />
                                                    <span className="text-sm text-gray-700">Paid</span>
                                                </div>
                                                <span className="text-sm font-medium">₹{stats.paidRevenue.toLocaleString()}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <div className="w-3 h-3 rounded-full bg-yellow-500 mr-3" />
                                                    <span className="text-sm text-gray-700">Pending</span>
                                                </div>
                                                <span className="text-sm font-medium">₹{stats.pendingRevenue.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Overlay for Assignment Form */}
            {showAssignForm && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                    <div className="bg-white shadow-xl rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-6 border-b border-gray-200">
                            <h3 className="text-xl font-semibold text-gray-900">Create New Assignment</h3>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setShowAssignForm(false)
                                    setConflictWarning(null)
                                }}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {errors.general && <div className="text-red-500 text-sm">{errors.general}</div>}

                            {/* Assignment Type Selector */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Assignment Type</label>
                                <select
                                    value={formData.assignment_type}
                                    onChange={(e) => handleInputChange('assignment_type', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="adhoc">Adhoc Class (One-time class with selectable date)</option>
                                    <option value="weekly">Weekly Recurring (Recurring weekly classes till end date)</option>
                                    <option value="monthly">Regular Packages (Monthly recurring packages)</option>
                                    <option value="crash_course">Crash Course (Fixed duration course with auto-calculated end date)</option>
                                </select>
                                {errors.assignment_type && <p className="text-red-500 text-sm mt-1">{errors.assignment_type}</p>}
                            </div>

                            {/* Timeline Description Display */}
                            {formData.timeline_description && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Calendar className="w-4 h-4 text-blue-600" />
                                        <span className="font-medium text-blue-800">Assignment Timeline</span>
                                    </div>
                                    <p className="text-blue-700">{formData.timeline_description}</p>
                                    {formData.total_classes > 0 && (
                                        <p className="text-sm text-blue-600 mt-1">
                                            Total estimated classes: {formData.total_classes}
                                        </p>
                                    )}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    {formData.assignment_type === 'crash_course' ? 'Crash Course Package' :
                                        formData.assignment_type === 'monthly' ? 'Regular Package' :
                                            'Class Type'}
                                </label>
                                <select
                                    value={(formData.assignment_type === 'crash_course' || formData.assignment_type === 'monthly') ? formData.package_id : formData.class_type_id}
                                    onChange={(e) => {
                                        if (formData.assignment_type === 'crash_course' || formData.assignment_type === 'monthly') {
                                            handleInputChange('package_id', e.target.value)
                                            handleInputChange('class_type_id', '') // Clear class_type_id when using package
                                        } else {
                                            handleInputChange('class_type_id', e.target.value)
                                            handleInputChange('package_id', '') // Clear package_id when using class type
                                        }
                                    }}
                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">
                                        {formData.assignment_type === 'crash_course' ? 'Select crash course package' :
                                            formData.assignment_type === 'monthly' ? 'Select regular package' :
                                                'Select class type'}
                                    </option>
                                    {formData.assignment_type === 'crash_course'
                                        ? packages.filter(pkg => pkg.course_type === 'crash').map(pkg => (
                                            <option key={pkg.id} value={pkg.id}>
                                                {pkg.name} - {pkg.type || 'Standard'} ({pkg.duration} - {pkg.class_count} classes - ₹{pkg.price})
                                            </option>
                                        ))
                                        : formData.assignment_type === 'monthly'
                                            ? packages.filter(pkg => pkg.course_type === 'regular').map(pkg => (
                                                <option key={pkg.id} value={pkg.id}>
                                                    {pkg.name} - {pkg.type || 'Standard'} ({pkg.duration} - {pkg.class_count} classes - ₹{pkg.price})
                                                </option>
                                            ))
                                            : classTypes.map(ct => (
                                                <option key={ct.id} value={ct.id}>
                                                    {ct.name} ({ct.difficulty_level})
                                                </option>
                                            ))
                                    }
                                </select>
                                {errors.class_type_id && <p className="text-red-500 text-sm mt-1">{errors.class_type_id}</p>}
                                {errors.package_id && <p className="text-red-500 text-sm mt-1">{errors.package_id}</p>}

                                {/* Show selected package details */}
                                {formData.package_id && (formData.assignment_type === 'crash_course' || formData.assignment_type === 'monthly') && (() => {
                                    const selectedPkg = packages.find(pkg => pkg.id === formData.package_id)
                                    return selectedPkg && (
                                        <div className={`mt-2 p-3 border rounded-md ${formData.assignment_type === 'crash_course'
                                                ? 'bg-blue-50 border-blue-200'
                                                : 'bg-green-50 border-green-200'
                                            }`}>
                                            <div className={`text-sm ${formData.assignment_type === 'crash_course'
                                                    ? 'text-blue-800'
                                                    : 'text-green-800'
                                                }`}>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-medium">Package Details:</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                    <div><strong>Type:</strong> {selectedPkg.type || 'Standard'}</div>
                                                    <div><strong>Duration:</strong> {selectedPkg.duration}</div>
                                                    <div><strong>Classes:</strong> {selectedPkg.class_count}</div>
                                                    <div><strong>Price:</strong> ₹{selectedPkg.price}</div>
                                                    {selectedPkg.validity_days && <div><strong>Validity:</strong> {selectedPkg.validity_days} days</div>}
                                                    {selectedPkg.description && <div className="col-span-2"><strong>Description:</strong> {selectedPkg.description}</div>}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })()}
                            </div>

                            {/* Dynamic Date/Time Fields Based on Assignment Type */}
                            {formData.assignment_type === 'adhoc' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Calendar className="w-4 h-4 inline mr-1" />
                                        Class Date
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => handleInputChange('date', e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
                                </div>
                            )}

                            {(formData.assignment_type === 'weekly' || formData.assignment_type === 'monthly' || formData.assignment_type === 'crash_course') && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <Calendar className="w-4 h-4 inline mr-1" />
                                            Start Date
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.start_date}
                                            onChange={(e) => handleInputChange('start_date', e.target.value)}
                                            min={new Date().toISOString().split('T')[0]}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                        {errors.start_date && <p className="text-red-500 text-sm mt-1">{errors.start_date}</p>}
                                    </div>

                                    {formData.assignment_type !== 'crash_course' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                <Calendar className="w-4 h-4 inline mr-1" />
                                                End Date
                                            </label>
                                            <input
                                                type="date"
                                                value={formData.end_date}
                                                onChange={(e) => handleInputChange('end_date', e.target.value)}
                                                min={formData.start_date || new Date().toISOString().split('T')[0]}
                                                max={`${new Date().getFullYear()}-12-31`}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                            {errors.end_date && <p className="text-red-500 text-sm mt-1">{errors.end_date}</p>}
                                        </div>
                                    )}

                                    {formData.assignment_type === 'crash_course' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Course Duration</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="12"
                                                    value={formData.course_duration_value}
                                                    onChange={(e) => handleInputChange('course_duration_value', parseInt(e.target.value))}
                                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Duration"
                                                />
                                                <select
                                                    value={formData.course_duration_unit}
                                                    onChange={(e) => handleInputChange('course_duration_unit', e.target.value)}
                                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="weeks">Weeks</option>
                                                    <option value="months">Months</option>
                                                </select>
                                            </div>
                                            {formData.start_date && formData.end_date && (
                                                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-green-600" />
                                                        <span className="text-sm font-medium text-green-800">Auto-calculated Course Period</span>
                                                    </div>
                                                    <p className="text-sm text-green-700 mt-1">
                                                        <strong>Start:</strong> {formatDate(formData.start_date)} → <strong>End:</strong> {formatDate(formData.end_date)}
                                                    </p>
                                                    <p className="text-xs text-green-600 mt-1">
                                                        End date is automatically calculated as Start Date + {formData.course_duration_value} {formData.course_duration_unit}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Day Selection for Weekly */}
                            {formData.assignment_type === 'weekly' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Day of Week</label>
                                    <select
                                        value={formData.day_of_week}
                                        onChange={(e) => handleInputChange('day_of_week', parseInt(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value={0}>Sunday</option>
                                        <option value={1}>Monday</option>
                                        <option value={2}>Tuesday</option>
                                        <option value={3}>Wednesday</option>
                                        <option value={4}>Thursday</option>
                                        <option value={5}>Friday</option>
                                        <option value={6}>Saturday</option>
                                    </select>
                                </div>
                            )}

                            {/* Day Selection for Monthly */}
                            {formData.assignment_type === 'monthly' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Day of Month</label>
                                    <select
                                        value={formData.day_of_month}
                                        onChange={(e) => handleInputChange('day_of_month', parseInt(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                            <option key={day} value={day}>{day}{getOrdinalSuffix(day)}</option>
                                        ))}
                                        <option value={-1}>Last day of month</option>
                                    </select>
                                </div>
                            )}

                            {/* Class Frequency for Crash Courses */}
                            {formData.assignment_type === 'crash_course' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Class Frequency</label>
                                    <select
                                        value={formData.class_frequency}
                                        onChange={(e) => handleInputChange('class_frequency', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="specific">Specific Days</option>
                                    </select>
                                </div>
                            )}


                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <ClockSelector
                                        value={formData.start_time}
                                        onChange={handleStartTimeChange}
                                        label="Start Time"
                                        error={errors.start_time}
                                    />
                                </div>

                                <div>
                                    <ClockSelector
                                        value={formData.end_time}
                                        onChange={handleEndTimeChange}
                                        label="End Time"
                                        error={errors.end_time}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Duration
                                    </label>
                                    <select
                                        value={formData.duration}
                                        onChange={(e) => handleDurationChange(parseInt(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        {getDurationOptions().map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                    {formData.duration && (
                                        <p className="text-sm text-gray-600 mt-1">
                                            Duration: {formData.duration} minutes
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Conflict Warning */}
                            {conflictWarning?.hasConflict && (
                                <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start space-x-3">
                                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <h4 className="text-sm font-medium text-red-800">Scheduling Conflict</h4>
                                        <p className="text-sm text-red-700 mt-1">{conflictWarning.message}</p>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Instructor / Yoga Acharya
                                    {formData.date && formData.start_time && formData.end_time && (
                                        <span className="text-sm text-gray-500 ml-2">
                                            ({availableInstructors.length} available)
                                        </span>
                                    )}
                                </label>
                                <select
                                    value={formData.instructor_id}
                                    onChange={(e) => handleInputChange('instructor_id', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select instructor</option>
                                    {availableInstructors.map(profile => (
                                        <option key={profile.user_id} value={profile.user_id}>
                                            {profile.full_name || profile.email}
                                        </option>
                                    ))}
                                </select>
                                {errors.instructor_id && <p className="text-red-500 text-sm mt-1">{errors.instructor_id}</p>}
                                {errors.conflict && <p className="text-red-500 text-sm mt-1">{errors.conflict}</p>}
                            </div>

                            {/* Payment Configuration */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Type</label>
                                    <select
                                        value={formData.payment_type}
                                        onChange={(e) => handleInputChange('payment_type', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="per_class">Per Class</option>
                                        <option value="monthly">Monthly</option>
                                        <option value="total_duration">Total Duration</option>
                                        {formData.assignment_type === 'weekly' && (
                                            <>
                                                <option value="per_member">Per Student Monthly Rate (Weekly Classes)</option>
                                                <option value="per_class_total">Total Per Class (Weekly Classes)</option>
                                            </>
                                        )}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Payment Amount (₹)
                                        <span className="text-sm text-gray-500 ml-1">
                                            {formData.payment_type === 'per_class' && '(per class)'}
                                            {formData.payment_type === 'monthly' && '(per month)'}
                                            {formData.payment_type === 'total_duration' && '(total amount)'}
                                            {formData.payment_type === 'per_member' && '(per student monthly rate)'}
                                            {formData.payment_type === 'per_class_total' && '(total per class)'}
                                        </span>
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.payment_amount}
                                        onChange={(e) => handleInputChange('payment_amount', parseFloat(e.target.value) || 0)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder={
                                            formData.payment_type === 'per_class' ? 'Amount per class' :
                                                formData.payment_type === 'monthly' ? 'Monthly payment amount' :
                                                    formData.payment_type === 'per_member' ? 'Rate per student per month' :
                                                        formData.payment_type === 'per_class_total' ? 'Total amount per class' :
                                                            'Total course amount'
                                        }
                                    />
                                    {errors.payment_amount && <p className="text-red-500 text-sm mt-1">{errors.payment_amount}</p>}
                                </div>
                            </div>

                            {/* Payment Summary */}
                            {formData.total_classes > 0 && formData.payment_amount > 0 && (
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <DollarSign className="w-4 h-4 text-gray-600" />
                                        <span className="font-medium text-gray-800">Payment Summary</span>
                                    </div>
                                    <div className="text-sm text-gray-700">
                                        {formData.payment_type === 'per_class' && (
                                            <p>
                                                <strong>Per Class:</strong> ₹{formData.payment_amount} × {formData.total_classes} classes =
                                                <span className="font-semibold text-green-600 ml-1">
                                                    ₹{(formData.payment_amount * formData.total_classes).toLocaleString()}
                                                </span>
                                            </p>
                                        )}
                                        {formData.payment_type === 'monthly' && (
                                            <p>
                                                <strong>Monthly:</strong> ₹{formData.payment_amount} per month × estimated {Math.ceil(formData.total_classes / 4)} months =
                                                <span className="font-semibold text-green-600 ml-1">
                                                    ₹{(formData.payment_amount * Math.ceil(formData.total_classes / 4)).toLocaleString()}
                                                </span>
                                            </p>
                                        )}
                                        {formData.payment_type === 'total_duration' && (
                                            <p>
                                                <strong>Total Duration:</strong>
                                                <span className="font-semibold text-green-600 ml-1">
                                                    ₹{formData.payment_amount.toLocaleString()}
                                                </span>
                                                {' '}for entire course ({formData.total_classes} classes)
                                            </p>
                                        )}
                                        {formData.payment_type === 'per_member' && (
                                            <div>
                                                <p>
                                                    <strong>Per Student Monthly Rate:</strong> ₹{formData.payment_amount} per student per month
                                                </p>
                                                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                                                    <p className="text-blue-700">
                                                        <strong>Monthly Payment Calculation:</strong>
                                                    </p>
                                                    <p className="text-blue-800 font-medium">Formula: Students enrolled × Monthly rate × Weekly classes in month</p>
                                                    <div className="mt-2 space-y-1">
                                                        <p className="text-blue-600">• <strong>Month 1:</strong> 5 students × ₹{formData.payment_amount} × 4 weeks = <span className="font-semibold">₹{(formData.payment_amount * 5 * 4).toLocaleString()}</span></p>
                                                        <p className="text-blue-600">• <strong>Month 2:</strong> 7 students × ₹{formData.payment_amount} × 4 weeks = <span className="font-semibold">₹{(formData.payment_amount * 7 * 4).toLocaleString()}</span></p>
                                                        <p className="text-blue-600">• <strong>Month 3:</strong> 10 students × ₹{formData.payment_amount} × 4 weeks = <span className="font-semibold">₹{(formData.payment_amount * 10 * 4).toLocaleString()}</span></p>
                                                    </div>
                                                    <p className="text-blue-500 text-xs mt-2">
                                                        * Payment calculated monthly based on enrolled students that month
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        {formData.payment_type === 'per_class_total' && (
                                            <div>
                                                <p>
                                                    <strong>Total Per Class:</strong> ₹{formData.payment_amount} per class (fixed amount)
                                                </p>
                                                <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs">
                                                    <p className="text-orange-700">
                                                        <strong>Fixed Class Payment:</strong>
                                                    </p>
                                                    <p className="text-orange-600">• Instructor receives ₹{formData.payment_amount.toLocaleString()} per class regardless of attendance</p>
                                                    <p className="text-orange-600">• Total for {formData.total_classes} classes: <span className="font-semibold">₹{(formData.payment_amount * formData.total_classes).toLocaleString()}</span></p>
                                                    <p className="text-orange-500 text-xs mt-1">
                                                        * Payment is fixed per class, independent of member count
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => handleInputChange('notes', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={3}
                                    placeholder="Add any additional notes..."
                                />
                            </div>

                            <div className="flex justify-end space-x-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setShowAssignForm(false)
                                        setConflictWarning(null)
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={saving || conflictWarning?.hasConflict}>
                                    <Save className="w-4 h-4 mr-2" />
                                    {saving ? 'Saving...' : 'Assign Class'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ClassAssignmentManager