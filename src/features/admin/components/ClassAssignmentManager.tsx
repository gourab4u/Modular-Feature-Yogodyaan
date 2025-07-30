import { Calendar, Clock, DollarSign, Plus, Save, Users, X, AlertTriangle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '../../../shared/components/ui/Button'
import { LoadingSpinner } from '../../../shared/components/ui/LoadingSpinner'
import  ClockSelector from '../../../shared/components/ui/ClockSelector'
import { supabase } from '../../../shared/lib/supabase'

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
  })

  useEffect(() => {
    fetchData()
  }, [])

  // Auto-calculate end dates and timeline descriptions when relevant fields change
  useEffect(() => {
    updateTimelineInfo()
  }, [formData.assignment_type, formData.start_date, formData.course_duration_value, formData.course_duration_unit, formData.day_of_week, formData.day_of_month])

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

      const { data: classTypesData } = await supabase.from('class_types').select('id, name, difficulty_level, course_type')
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
    
    // Common validations - only for non-monthly assignments
    if (formData.assignment_type !== 'monthly' && !formData.class_type_id) {
      newErrors.class_type_id = 'Class type is required'
    }
    if (!formData.instructor_id) newErrors.instructor_id = 'Instructor is required'
    if (!formData.start_time) newErrors.start_time = 'Start time is required'
    if (!formData.end_time) newErrors.end_time = 'End time is required'
    if (formData.payment_amount <= 0) newErrors.payment_amount = 'Amount must be greater than 0'
    
    // Assignment type specific validations
    switch (formData.assignment_type) {
      case 'adhoc':
        if (!formData.date) newErrors.date = 'Date is required'
        break
        
      case 'weekly':
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
    
    // Generate all monthly occurrences
    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      // Calculate the actual date for this month
      let classDate = new Date(currentDate)
      
      if (formData.day_of_month === -1) {
        // Last day of month
        classDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
      } else {
        // Specific day of month
        classDate.setDate(formData.day_of_month)
        
        // If the day doesn't exist in this month (e.g., Feb 31st), use the last day
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
        payment_amount: formData.payment_amount,
        notes: `Regular Package (Monthly recurring): ${formData.notes || 'Auto-generated'}`,
        schedule_type: 'adhoc',
        assigned_by: currentUserId,
        assigned_at: new Date().toISOString(),
        class_status: 'scheduled' as const,
        payment_status: 'pending' as const,
        payment_date: null
      })
      
      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1)
    }

    console.log('Creating monthly assignments:', assignments.length, 'classes')
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
    // This would involve:
    // 1. Fetching package definition from packages table
    // 2. Creating assignments based on package structure
    // 3. Possibly creating a package_assignments table entry
    
    console.log('Package assignments not yet implemented')
    throw new Error('Package assignments are not yet implemented. Please implement based on your package structure.')
  }

  const availableInstructors = getAvailableInstructors()

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
          <Users className="w-5 h-5 mr-2" /> Class Assignment Manager
        </h2>
        <Button onClick={() => setShowAssignForm(true)}>
          <Plus className="w-4 h-4 mr-2" /> Assign Class
        </Button>
      </div>

      {showAssignForm && (
        <div className="bg-white shadow p-6 rounded-lg max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Assign New Class</h3>
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
          
          <form onSubmit={handleSubmit} className="space-y-4">
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
              {/* Show Crash Course Packages for Crash Course assignments */}
              {formData.assignment_type === 'crash_course' && (
                <>
                  <label className="block text-sm font-medium text-gray-700">Crash Course Package</label>
                  <select
                    value={formData.package_id}
                    onChange={(e) => handleInputChange('package_id', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select crash course package</option>
                    {packages.filter(pkg => pkg.course_type === 'crash').map(pkg => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name} - {pkg.type || 'Standard'} ({pkg.duration} - {pkg.class_count} classes - ₹{pkg.price})
                      </option>
                    ))}
                  </select>
                  {errors.package_id && <p className="text-red-500 text-sm mt-1">{errors.package_id}</p>}
                  {/* Show selected crash course package details */}
                  {formData.package_id && (() => {
                    const selectedPkg = packages.find(pkg => pkg.id === formData.package_id)
                    return selectedPkg && (
                      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <div className="text-sm text-blue-800">
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
                </>
              )}
              
              {/* Show Packages for Regular (Monthly) assignments */}
              {formData.assignment_type === 'monthly' && (
                <>
                  <label className="block text-sm font-medium text-gray-700">Regular Package</label>
                  <select
                    value={formData.package_id}
                    onChange={(e) => handleInputChange('package_id', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select regular package</option>
                    {packages.filter(pkg => pkg.course_type === 'regular').map(pkg => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name} - {pkg.type || 'Standard'} ({pkg.duration} - {pkg.class_count} classes - ₹{pkg.price})
                      </option>
                    ))}
                  </select>
                  {errors.package_id && <p className="text-red-500 text-sm mt-1">{errors.package_id}</p>}
                  {/* Show selected regular package details */}
                  {formData.package_id && (() => {
                    const selectedPkg = packages.find(pkg => pkg.id === formData.package_id)
                    return selectedPkg && (
                      <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                        <div className="text-sm text-green-800">
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
                </>
              )}
              
              {/* Show Class Types for other assignment types (adhoc, weekly) */}
              {(formData.assignment_type === 'adhoc' || formData.assignment_type === 'weekly') && (
                <>
                  <label className="block text-sm font-medium text-gray-700">Class Type</label>
                  <select
                    value={formData.class_type_id}
                    onChange={(e) => handleInputChange('class_type_id', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select class type</option>
                    {classTypes.map(ct => (
                      <option key={ct.id} value={ct.id}>
                        {ct.name} ({ct.difficulty_level})
                      </option>
                    ))}
                  </select>
                  {errors.class_type_id && <p className="text-red-500 text-sm mt-1">{errors.class_type_id}</p>}
                </>
              )}
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

            {/* Package Selection */}
            {formData.assignment_type === 'package' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Package</label>
                <select
                  value={formData.package_id}
                  onChange={(e) => handleInputChange('package_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a package</option>
                  {/* TODO: Load packages from database */}
                  <option value="beginner-yoga-package">Beginner Yoga Package (4 weeks)</option>
                  <option value="intermediate-yoga-package">Intermediate Yoga Package (6 weeks)</option>
                  <option value="advanced-yoga-package">Advanced Yoga Package (8 weeks)</option>
                </select>
                {errors.package_id && <p className="text-red-500 text-sm mt-1">{errors.package_id}</p>}
                <p className="text-sm text-gray-600 mt-1">
                  Package assignments will create classes based on the selected package structure and schedule.
                </p>
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

            <div>
              <label className="block text-sm font-medium text-gray-700">Payment Amount (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.payment_amount}
                onChange={(e) => handleInputChange('payment_amount', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.payment_amount && <p className="text-red-500 text-sm mt-1">{errors.payment_amount}</p>}
            </div>

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
      )}

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Assigned Classes</h3>
        {loading ? (
          <div className="flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Instructor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Payment Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assignments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No classes assigned yet
                    </td>
                  </tr>
                ) : (
                  assignments.map(assignment => (
                    <tr key={assignment.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        <div className="font-medium">{formatDate(assignment.date)}</div>
                        <div className="text-xs text-gray-500">{new Date(assignment.date).toLocaleDateString()}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        <div className="font-medium">{formatTime(assignment.start_time)} - {formatTime(assignment.end_time)}</div>
                        <div className="text-xs text-gray-500">
                          {assignment.start_time && assignment.end_time ? 
                            `${timeToMinutes(assignment.end_time) - timeToMinutes(assignment.start_time)} minutes` : 
                            '—'
                          }
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {assignment.class_type?.name || '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {assignment.instructor_profile?.full_name || assignment.instructor_profile?.email || '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
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
                          className={`text-sm border rounded px-2 py-1 ${
                            assignment.payment_status === 'cancelled' ? 'text-red-600 bg-red-50' :
                            assignment.payment_status === 'paid' ? 'text-green-600 bg-green-50' :
                            'text-yellow-600 bg-yellow-50'
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {assignment.payment_date ? new Date(assignment.payment_date).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}