import { Calendar, Clock, DollarSign, Filter, Plus, Save, Search, Users, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '../../../shared/components/ui/Button'
import { LoadingSpinner } from '../../../shared/components/ui/LoadingSpinner'
import { supabase } from '../../../shared/lib/supabase'

interface ClassAssignment {
  id: string
  class_type_id: string
  date: string
  start_time: string
  end_time: string
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

export function ClassAssignmentManager() {
  const [assignments, setAssignments] = useState<ClassAssignment[]>([])
  const [classTypes, setClassTypes] = useState<any[]>([])
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [showAssignForm, setShowAssignForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<any>({})

  const [formData, setFormData] = useState({
    class_type_id: '',
    date: '',
    start_time: '',
    duration: 60, // duration in minutes
    instructor_id: '',
    payment_amount: 0,
    notes: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

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

      const { data: assignmentsData } = await supabase
        .from('class_assignments')
        .select('*')
        .eq('schedule_type', 'adhoc')
        .order('assigned_at', { ascending: false })

      const enrichedAssignments = (assignmentsData || []).map(assignment => {
        const classType = classTypesData?.find(ct => ct.id === assignment.class_type_id)
        const instructorProfile = profilesWithRoles.find(p => p.user_id === assignment.instructor_id)
        return {
          ...assignment,
          class_type: classType,
          instructor_profile: instructorProfile
        }
      })

      setClassTypes(classTypesData || [])
      setUserProfiles(profilesWithRoles)
      setAssignments(enrichedAssignments)
    } catch (e) {
      console.error('Fetch error:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: any = {}
    if (!formData.class_type_id) newErrors.class_type_id = 'Class type is required'
    if (!formData.date) newErrors.date = 'Date is required'
    if (!formData.start_time) newErrors.start_time = 'Start time is required'
    if (!formData.duration) newErrors.duration = 'Duration is required'
    if (!formData.instructor_id) newErrors.instructor_id = 'Instructor is required'
    if (formData.payment_amount <= 0) newErrors.payment_amount = 'Amount must be greater than 0'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const calculateEndTime = (startTime: string, durationMinutes: number) => {
    const [hours, minutes] = startTime.split(':').map(Number)
    const startDate = new Date()
    startDate.setHours(hours, minutes, 0, 0)
    
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000)
    
    return endDate.toTimeString().slice(0, 5) // Return in HH:MM format
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

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number)
    const date = new Date()
    date.setHours(hours, minutes)
    
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
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
        end_time: calculateEndTime(formData.start_time, formData.duration),
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
        duration: 60, 
        instructor_id: '', 
        payment_amount: 0, 
        notes: '' 
      })
      alert('Class assigned successfully')
    } catch (err: any) {
      console.error('Submit error:', err)
      setErrors({ general: err.message })
    } finally {
      setSaving(false)
    }
  }

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
        <div className="bg-white shadow p-6 rounded-lg max-w-xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Assign New Class</h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowAssignForm(false)}
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Start Time
                </label>
                <input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => handleInputChange('start_time', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.start_time && <p className="text-red-500 text-sm mt-1">{errors.start_time}</p>}
                {formData.start_time && (
                  <p className="text-sm text-gray-600 mt-1">
                    Starts at: {formatTime(formData.start_time)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration
                </label>
                <select
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {getDurationOptions().map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.duration && <p className="text-red-500 text-sm mt-1">{errors.duration}</p>}
                {formData.start_time && formData.duration && (
                  <p className="text-sm text-gray-600 mt-1">
                    Ends at: {formatTime(calculateEndTime(formData.start_time, formData.duration))}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Instructor / Yoga Acharya</label>
              <select
                value={formData.instructor_id}
                onChange={(e) => handleInputChange('instructor_id', e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select instructor</option>
                {userProfiles.map(profile => (
                  <option key={profile.user_id} value={profile.user_id}>
                    {profile.full_name || profile.email}
                  </option>
                ))}
              </select>
              {errors.instructor_id && <p className="text-red-500 text-sm mt-1">{errors.instructor_id}</p>}
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
                onClick={() => setShowAssignForm(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
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
                          {Math.round((new Date(`1970-01-01T${assignment.end_time}:00`) - new Date(`1970-01-01T${assignment.start_time}:00`)) / (1000 * 60))} minutes
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