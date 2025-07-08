import { Calendar, Clock, DollarSign, Filter, Plus, Save, Search, Users, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '../../../shared/components/ui/Button'
import { LoadingSpinner } from '../../../shared/components/ui/LoadingSpinner'
import { supabase } from '../../../shared/lib/supabase'

interface ClassAssignment {
  id?: string
  class_type_id: string
  date: string
  start_time: string
  end_time: string
  instructor_id: string
  assigned_by: string
  payment_amount: number
  payment_status: 'pending' | 'paid' | 'cancelled'
  notes?: string
  assigned_at?: string
  class_type?: any
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
        notes: formData.notes || null,
        schedule_type: 'adhoc' // ✅ set schedule type explicitly
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
  <label className="block text-sm font-medium text-gray-700">Class Type</label>
  <select
    value={formData.class_type_id}
    onChange={(e) => handleInputChange('class_type_id', e.target.value)}
    className="w-full px-3 py-2 border rounded"
  >
    <option value="">Select class type</option>
    {classTypes.map(ct => (
      <option key={ct.id} value={ct.id}>
        {ct.name} ({ct.difficulty_level})
      </option>
    ))}
  </select>
  {errors.class_type_id && <p className="text-red-500 text-sm">{errors.class_type_id}</p>}
</div>

<div>
  <label className="block text-sm font-medium text-gray-700">Date</label>
  <input
    type="date"
    value={formData.date}
    onChange={(e) => handleInputChange('date', e.target.value)}
    className="w-full px-3 py-2 border rounded"
  />
  {errors.date && <p className="text-red-500 text-sm">{errors.date}</p>}
</div>

<div className="flex space-x-2">
  <div className="flex-1">
    <label className="block text-sm font-medium text-gray-700">Start Time</label>
    <input
      type="time"
      value={formData.start_time}
      onChange={(e) => handleInputChange('start_time', e.target.value)}
      className="w-full px-3 py-2 border rounded"
    />
  </div>
  <div className="flex-1">
    <label className="block text-sm font-medium text-gray-700">End Time</label>
    <input
      type="time"
      value={formData.end_time}
      onChange={(e) => handleInputChange('end_time', e.target.value)}
      className="w-full px-3 py-2 border rounded"
    />
  </div>
</div>
{errors.start_time && <p className="text-red-500 text-sm">{errors.start_time}</p>}

<div>
  <label className="block text-sm font-medium text-gray-700">Instructor / Yoga Acharya</label>
  <select
    value={formData.instructor_id}
    onChange={(e) => handleInputChange('instructor_id', e.target.value)}
    className="w-full px-3 py-2 border rounded"
  >
    <option value="">Select instructor</option>
    {userProfiles.map(profile => (
      <option key={profile.user_id} value={profile.user_id}>
        {profile.full_name || profile.email}
      </option>
    ))}
  </select>
  {errors.instructor_id && <p className="text-red-500 text-sm">{errors.instructor_id}</p>}
</div>

<div>
  <label className="block text-sm font-medium text-gray-700">Payment Amount (₹)</label>
  <input
    type="number"
    value={formData.payment_amount}
    onChange={(e) => handleInputChange('payment_amount', parseFloat(e.target.value) || 0)}
    className="w-full px-3 py-2 border rounded"
  />
  {errors.payment_amount && <p className="text-red-500 text-sm">{errors.payment_amount}</p>}
</div>

<div>
  <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
  <textarea
    value={formData.notes}
    onChange={(e) => handleInputChange('notes', e.target.value)}
    className="w-full px-3 py-2 border rounded"
    rows={3}
  />
</div>

<div className="flex justify-end">
  <Button type="submit" loading={saving}>
    <Save className="w-4 h-4 mr-2" /> {saving ? 'Saving...' : 'Assign Class'}
  </Button>
</div>
          </form>
        </div>
      )}

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">Assigned Classes</h3>
        {loading ? <LoadingSpinner size="lg" /> : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Class Type</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Instructor</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {assignments.map(a => (
                <tr key={a.id}>
                  <td className="px-4 py-2">{a.date}</td>
                  <td className="px-4 py-2">{a.start_time} - {a.end_time}</td>
                  <td className="px-4 py-2">{a.class_type?.name || '—'}</td>
                  <td className="px-4 py-2">{a.instructor_profile?.full_name || '—'}</td>
                  <td className="px-4 py-2">₹{a.payment_amount}</td>
                  <td className="px-4 py-2 capitalize">{a.payment_status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
