import { Calendar, Clock, DollarSign, Filter, Plus, Save, Search, Users, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '../../../shared/components/ui/Button'
import { LoadingSpinner } from '../../../shared/components/ui/LoadingSpinner'
import { supabase } from '../../../shared/lib/supabase'

interface ClassAssignment {
  id?: string
  scheduled_class_id: string
  instructor_id: string
  assigned_by: string
  payment_amount: number
  payment_status: 'pending' | 'paid' | 'cancelled'
  notes?: string
  assigned_at: string
  class_schedule?: any
  instructor_profile?: any
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
  const [classSchedules, setClassSchedules] = useState<any[]>([])
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [showAssignForm, setShowAssignForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<any>({})

  const [formData, setFormData] = useState({
    scheduled_class_id: '',
    instructor_id: '',
    role_type: 'instructor',
    payment_amount: 0,
    notes: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      const { data: schedules } = await supabase
        .from('class_schedules')
        .select('*, class_types(id, name, difficulty_level)')
        .order('day_of_week')
        .order('start_time')

      const { data: roles } = await supabase
        .from('roles')
        .select('id, name')
        .in('name', ['instructor', 'yoga_acharya'])

      const roleIds = roles.map(r => r.id)
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('user_id, role_id')
        .in('role_id', roleIds)

      const userIds = [...new Set(userRoles.map(ur => ur.user_id))]
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds)

      const profilesWithRoles = profiles.map(profile => {
        const userRoleIds = userRoles.filter(ur => ur.user_id === profile.user_id).map(ur => ur.role_id)
        const profileRoles = roles.filter(role => userRoleIds.includes(role.id)).map(role => ({ roles: { name: role.name } }))
        return {
          ...profile,
          user_roles: profileRoles
        }
      })

      const { data: assignmentsData } = await supabase
        .from('class_assignments')
        .select('*')
        .order('assigned_at', { ascending: false })

      const enrichedAssignments = (assignmentsData || []).map(assignment => {
        const classSchedule = schedules.find(cls => cls.id === assignment.scheduled_class_id)
        const instructorProfile = profilesWithRoles.find(p => p.user_id === assignment.instructor_id)
        return {
          ...assignment,
          class_schedule: classSchedule,
          instructor_profile: instructorProfile
        }
      })

      setClassSchedules(schedules)
      setUserProfiles(profilesWithRoles)
      setAssignments(enrichedAssignments)
    } catch (e) {
      console.error('Fetch error:', e)
    } finally {
      setLoading(false)
    }
  }

  const isSlotOccupied = (scheduleId: string, instructorId: string) => {
    const selectedSchedule = classSchedules.find(cs => cs.id === scheduleId)
    if (!selectedSchedule) return false

    return assignments.some(a => {
      const assignedSchedule = classSchedules.find(cs => cs.id === a.scheduled_class_id)
      return (
        a.instructor_id === instructorId &&
        assignedSchedule?.day_of_week === selectedSchedule.day_of_week &&
        assignedSchedule?.start_time === selectedSchedule.start_time
      )
    })
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: any = {}
    if (!formData.scheduled_class_id) newErrors.scheduled_class_id = 'Class is required'
    if (!formData.instructor_id) newErrors.instructor_id = 'Instructor is required'
    if (formData.payment_amount <= 0) newErrors.payment_amount = 'Amount must be greater than 0'

    if (isSlotOccupied(formData.scheduled_class_id, formData.instructor_id)) {
      newErrors.scheduled_class_id = 'Instructor is already assigned to another class at this time'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      setSaving(true)
      const currentUser = await supabase.auth.getUser()
      const assignment = {
        scheduled_class_id: formData.scheduled_class_id,
        instructor_id: formData.instructor_id,
        assigned_by: currentUser.data.user?.id,
        payment_amount: formData.payment_amount,
        payment_status: 'pending',
        notes: formData.notes || null
      }

      const { error } = await supabase.from('class_assignments').insert([assignment])
      if (error) throw error

      await fetchData()
      setShowAssignForm(false)
      setFormData({ scheduled_class_id: '', instructor_id: '', role_type: 'instructor', payment_amount: 0, notes: '' })
      alert('Class assigned successfully')
    } catch (err: any) {
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
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.general && <div className="text-red-500">{errors.general}</div>}

            <div>
              <label className="block text-sm font-medium">Class Schedule</label>
              <select
                value={formData.scheduled_class_id}
                onChange={(e) => handleInputChange('scheduled_class_id', e.target.value)}
                className="w-full border px-3 py-2 rounded-lg"
              >
                <option value="">Select a class</option>
                {classSchedules.map(cs => (
                  <option key={cs.id} value={cs.id}>
                    {cs.class_types?.name || 'Class'} - {cs.day_of_week}, {cs.start_time} to {cs.end_time}
                  </option>
                ))}
              </select>
              {errors.scheduled_class_id && <p className="text-red-500 text-sm">{errors.scheduled_class_id}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium">Instructor / Yoga Acharya</label>
              <select
                value={formData.instructor_id}
                onChange={(e) => handleInputChange('instructor_id', e.target.value)}
                className="w-full border px-3 py-2 rounded-lg"
              >
                <option value="">Select person</option>
                {userProfiles.map(profile => (
                  <option key={profile.user_id} value={profile.user_id}>
                    {profile.full_name || profile.email}
                  </option>
                ))}
              </select>
              {errors.instructor_id && <p className="text-red-500 text-sm">{errors.instructor_id}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium">Payment Amount</label>
              <input
                type="number"
                value={formData.payment_amount}
                onChange={(e) => handleInputChange('payment_amount', parseFloat(e.target.value))}
                className="w-full border px-3 py-2 rounded-lg"
              />
              {errors.payment_amount && <p className="text-red-500 text-sm">{errors.payment_amount}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="w-full border px-3 py-2 rounded-lg"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowAssignForm(false)}>Cancel</Button>
              <Button type="submit" loading={saving}><Save className="w-4 h-4 mr-2" /> Assign</Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded shadow-md">
        {loading ? <LoadingSpinner size="lg" /> : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Instructor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map(a => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{a.class_schedule?.class_types?.name || 'Class'} - {a.class_schedule?.day_of_week} {a.class_schedule?.start_time}</td>
                  <td className="px-6 py-4">{a.instructor_profile?.full_name || 'Unknown'}</td>
                  <td className="px-6 py-4">${a.payment_amount}</td>
                  <td className="px-6 py-4 capitalize">{a.payment_status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
