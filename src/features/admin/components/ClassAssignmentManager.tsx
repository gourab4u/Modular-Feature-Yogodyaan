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
    end_time: '',
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

      setClassTypes(classTypesData || [])
      setUserProfiles(profilesWithRoles)
      setAssignments(assignmentsData || [])
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
    if (!formData.start_time || !formData.end_time) newErrors.start_time = 'Time range is required'
    if (!formData.instructor_id) newErrors.instructor_id = 'Instructor is required'
    if (formData.payment_amount <= 0) newErrors.payment_amount = 'Amount must be greater than 0'

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
        class_type_id: formData.class_type_id,
        date: formData.date,
        start_time: formData.start_time,
        end_time: formData.end_time,
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
      setFormData({ class_type_id: '', date: '', start_time: '', end_time: '', instructor_id: '', payment_amount: 0, notes: '' })
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
              <label className="block text-sm font-medium">Class Type</label>
              <select
                value={formData.class_type_id}
                onChange={(e) => handleInputChange('class_type_id', e.target.value)}
                className="w-full border px-3 py-2 rounded-lg"
              >
                <option value="">Select class type</option>
                {classTypes.map(ct => (
                  <option key={ct.id} value={ct.id}>{ct.name}</option>
                ))}
              </select>
              {errors.class_type_id && <p className="text-red-500 text-sm">{errors.class_type_id}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className="w-full border px-3 py-2 rounded-lg"
              />
              {errors.date && <p className="text-red-500 text-sm">{errors.date}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Start Time</label>
                <input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => handleInputChange('start_time', e.target.value)}
                  className="w-full border px-3 py-2 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">End Time</label>
                <input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => handleInputChange('end_time', e.target.value)}
                  className="w-full border px-3 py-2 rounded-lg"
                />
              </div>
            </div>
            {errors.start_time && <p className="text-red-500 text-sm">{errors.start_time}</p>}

            <div>
              <label className="block text-sm font-medium">Instructor / Yoga Acharya</label>
              <select
                value={formData.instructor_id}
                onChange={(e) => handleInputChange('instructor_id', e.target.value)}
                className="w-full border px-3 py-2 rounded-lg"
              >
                <option value="">Select person</option>
                {userProfiles.map(profile => (
                  <option key={profile.user_id} value={profile.user_id}>{profile.full_name}</option>
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
    </div>
  )
}
