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
  class_status?: 'active' | 'inactive' | 'cancelled'
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
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [showAssignForm, setShowAssignForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<any>({})
  const [conflictWarning, setConflictWarning] = useState<ConflictDetails | null>(null)

  const [formData, setFormData] = useState({
    class_type_id: '',
    date: '',
    start_time: '',
    end_time: '',
    duration: 60, // duration in minutes
    instructor_id: '',
    payment_amount: 0,
    notes: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

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

      // Fetch adhoc assignments
      const { data: assignmentsData } = await supabase
        .from('class_assignments')
        .select('*')
        .eq('schedule_type', 'adhoc')
        .order('assigned_at', { ascending: false })

      // Fetch weekly schedules
      const { data: weeklySchedulesData } = await supabase
        .from('class_schedules')
        .select('*')
        .eq('class_status', 'active')
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
      if (schedule.class_status !== 'active') return false
      
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
        if (schedule.class_status !== 'active') return false
        
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
    if (!formData.class_type_id) newErrors.class_type_id = 'Class type is required'
    if (!formData.date) newErrors.date = 'Date is required'
    if (!formData.start_time) newErrors.start_time = 'Start time is required'
    if (!formData.end_time) newErrors.end_time = 'End time is required'
    if (!formData.instructor_id) newErrors.instructor_id = 'Instructor is required'
    if (formData.payment_amount <= 0) newErrors.payment_amount = 'Amount must be greater than 0'
    
    // Validate that end time is after start time
    if (formData.start_time && formData.end_time) {
      const startMinutes = timeToMinutes(formData.start_time);
      const endMinutes = timeToMinutes(formData.end_time);
      if (endMinutes <= startMinutes) {
        newErrors.end_time = 'End time must be after start time';
      }
    }

    // Check for conflicts
    if (conflictWarning?.hasConflict) {
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
      
      const assignment = {
        class_type_id: formData.class_type_id,
        date: formData.date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        instructor_id: formData.instructor_id,
        payment_amount: formData.payment_amount,
        notes: formData.notes,
        schedule_type: 'adhoc',
        assigned_by: currentUser.data.user?.id || '',
        assigned_at: new Date().toISOString(),
        class_status: 'scheduled' as const,
        payment_status: 'pending' as const,
        payment_date: null
      }

      const { error } = await supabase.from('class_assignments').insert([assignment])
      if (error) throw error

      await fetchData()
      setShowAssignForm(false)
      setFormData({ 
        class_type_id: '', 
        date: '', 
        start_time: '', 
        end_time: '',
        duration: 60, 
        instructor_id: '', 
        payment_amount: 0, 
        notes: '' 
      })
      setConflictWarning(null)
      alert('Class assigned successfully')
    } catch (err: any) {
      console.error('Submit error:', err)
      setErrors({ general: err.message })
    } finally {
      setSaving(false)
    }
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
            
            <div>
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
            </div>

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
              {formData.date && (
                <p className="text-sm text-gray-600 mt-1">
                  Selected: {formatDate(formData.date)}
                </p>
              )}
            </div>

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