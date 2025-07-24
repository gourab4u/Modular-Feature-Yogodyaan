import { Archive, Award, Edit, Eye, Plus, RotateCcw, Save, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '../../../../shared/components/ui/Button'
import { LoadingSpinner } from '../../../../shared/components/ui/LoadingSpinner'
import { supabase } from '../../../../shared/lib/supabase'
import { useAuth } from '../../../auth/contexts/AuthContext'; // Add this import

interface ClassType {
  id?: string
  name: string
  description: string
  difficulty_level: string
  price: number
  duration_minutes: number
  max_participants: number
  is_active: boolean
  is_archived?: boolean
  archived_at?: string
  created_by?: string  // Add these fields for RLS
  updated_by?: string
}

// Add interfaces for role checking
interface UserProfile {
  id: string
  user_id: string
  full_name?: string
  email?: string
  roles?: string[]
  hasRole?: (roleName: string) => boolean
  [key: string]: any
}

export function ClassTypeManager() {
  const { user } = useAuth() // Add this
  const [classTypes, setClassTypes] = useState<ClassType[]>([])
  const [archivedClassTypes, setArchivedClassTypes] = useState<ClassType[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingClassType, setEditingClassType] = useState<ClassType | null>(null)
  const [errors, setErrors] = useState<any>({})
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active')
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null) // Update type

  const [formData, setFormData] = useState<ClassType>({
    name: '',
    description: '',
    difficulty_level: 'beginner',
    price: 800,
    duration_minutes: 60,
    max_participants: 20,
    is_active: true,
    is_archived: false
  })

  const difficultyLevels = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' }
  ]

  // Add this useEffect to fetch user profile and check permissions from user_roles table
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.id) {
        try {
          // First get the user's basic profile
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .single()

          if (profileError) {
            console.error('Error fetching user profile:', profileError)
            return
          }

          // Then get the user's roles from user_roles table
          const { data: userRoles, error: rolesError } = await supabase
            .from('user_roles')
            .select(`
              role_id,
              roles!inner(name)
            `)
            .eq('user_id', user.id)

          if (rolesError) {
            console.error('Error fetching user roles:', rolesError)
            setUserProfile({ ...profile, roles: [] })
            return
          }

          // Extract role names from the joined query - handle the actual structure safely
          let roleNames: string[] = []

          if (userRoles && Array.isArray(userRoles)) {
            roleNames = userRoles
              .map((ur: any) => {
                // Handle both possible structures
                if (ur.roles && typeof ur.roles === 'object') {
                  return ur.roles.name
                }
                return null
              })
              .filter(Boolean) // Remove null values
          }

          console.log('Raw userRoles data:', userRoles) // Debug log to see actual structure
          console.log('Extracted role names:', roleNames)

          const profileWithRoles = {
            ...profile,
            roles: roleNames,
            hasRole: (roleName: string) => roleNames.includes(roleName)
          }

          setUserProfile(profileWithRoles)
          console.log('User profile:', profileWithRoles)
          console.log('User roles:', roleNames)

          // Check if user has required permissions
          const allowedRoles = ['yoga_acharya', 'admin', 'super_admin']
          const hasRequiredRole = roleNames.some(role => allowedRoles.includes(role))

          if (!hasRequiredRole) {
            console.warn('User does not have required role for class management. Current roles:', roleNames)
          }
        } catch (error) {
          console.error('Error checking user permissions:', error)
        }
      }
    }

    fetchUserProfile()
  }, [user])

  useEffect(() => {
    fetchClassTypes()
  }, [])

  const fetchClassTypes = async () => {
    try {
      setLoading(true)

      // Fetch active classes (not archived)
      const { data: activeData, error: activeError } = await supabase
        .from('class_types')
        .select('*')
        .eq('is_archived', false)
        .order('name')

      if (activeError) throw activeError

      // Fetch archived classes
      const { data: archivedData, error: archivedError } = await supabase
        .from('class_types')
        .select('*')
        .eq('is_archived', true)
        .order('archived_at', { ascending: false })

      if (archivedError) throw archivedError

      setClassTypes(activeData || [])
      setArchivedClassTypes(archivedData || [])
    } catch (error) {
      console.error('Error fetching class types:', error)
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

    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.description.trim()) newErrors.description = 'Description is required'
    if (formData.price < 0) newErrors.price = 'Price cannot be negative'
    if (formData.duration_minutes < 15) newErrors.duration_minutes = 'Duration must be at least 15 minutes'
    if (formData.max_participants < 1) newErrors.max_participants = 'Max participants must be at least 1'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Add permission check function
  const checkUserPermissions = () => {
    if (!user) {
      setErrors({ general: 'You must be logged in to perform this action' })
      return false
    }

    if (!userProfile) {
      setErrors({ general: 'User profile not loaded. Please try again.' })
      return false
    }

    const allowedRoles = ['yoga_acharya', 'admin', 'super_admin']
    const userRoles = userProfile.roles || []
    const hasRequiredRole = userRoles.some((role: string) => allowedRoles.includes(role))

    if (!hasRequiredRole) {
      setErrors({
        general: `Access denied. Required roles: ${allowedRoles.join(', ')}. Your roles: ${userRoles.join(', ') || 'none'}`
      })
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    // Check permissions before proceeding
    if (!checkUserPermissions()) return

    try {
      setSaving(true)

      if (editingClassType) {
        const { error } = await supabase
          .from('class_types')
          .update({
            ...formData,
            updated_by: user?.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingClassType.id)

        if (error) throw error
      } else {
        // For new class types, include user tracking fields
        const classTypeData = {
          ...formData,
          is_archived: false,
          created_by: user?.id,
          updated_by: user?.id,
        }

        console.log('Inserting class type with data:', classTypeData)
        console.log('Current user:', user)
        console.log('User profile role:', userProfile?.role)

        const { error } = await supabase
          .from('class_types')
          .insert([classTypeData])

        if (error) {
          console.error('Insert error:', error)
          throw error
        }
      }

      await fetchClassTypes()
      resetForm()
      alert(editingClassType ? 'Class type updated successfully!' : 'Class type created successfully!')
    } catch (error: any) {
      console.error('Error saving class type:', error)

      // More specific error handling for RLS
      if (error.message.includes('row-level security') || error.message.includes('policy')) {
        setErrors({
          general: `Permission denied. Please ensure you have the required role (yoga_acharya, admin, or super_admin). Current roles: ${userProfile?.roles?.join(', ') || 'none'}`
        })
      } else {
        setErrors({ general: error.message })
      }
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (classType: ClassType) => {
    if (!checkUserPermissions()) return

    setEditingClassType(classType)
    setFormData({ ...classType })
    setShowForm(true)
  }

  const handleArchive = async (id: string) => {
    if (!checkUserPermissions()) return

    if (!confirm('Are you sure you want to archive this class type? It will be moved to the archived section and all related schedules will be deactivated.')) return

    try {
      setLoading(true)

      // Archive the class type
      const { error: classTypeError } = await supabase
        .from('class_types')
        .update({
          is_archived: true,
          is_active: false,
          archived_at: new Date().toISOString(),
          updated_by: user?.id
        })
        .eq('id', id)

      if (classTypeError) throw classTypeError

      // Deactivate all related class schedules
      const { error: schedulesError } = await supabase
        .from('class_schedules')
        .update({
          is_active: false,
          effective_until: new Date().toISOString().split('T')[0]
        })
        .eq('class_type_id', id)

      if (schedulesError) {
        console.error('Error deactivating schedules:', schedulesError)
        // Continue anyway, class type is already archived
      }

      await fetchClassTypes()
      alert('Class type archived successfully!')
    } catch (error: any) {
      console.error('Error archiving class type:', error)
      alert(`Failed to archive class type: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleUnarchive = async (id: string) => {
    if (!checkUserPermissions()) return

    if (!confirm('Are you sure you want to restore this class type from the archive?')) return

    try {
      setLoading(true)

      const { error } = await supabase
        .from('class_types')
        .update({
          is_archived: false,
          is_active: true,
          archived_at: null,
          updated_by: user?.id
        })
        .eq('id', id)

      if (error) throw error

      await fetchClassTypes()
      alert('Class type restored successfully!')
    } catch (error: any) {
      console.error('Error restoring class type:', error)
      alert(`Failed to restore class type: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      difficulty_level: 'beginner',
      price: 800,
      duration_minutes: 60,
      max_participants: 20,
      is_active: true,
      is_archived: false
    })
    setEditingClassType(null)
    setShowForm(false)
    setErrors({})
  }

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatPrice = (price: number) => {
    return `₹${price}`
  }

  const formatArchiveDate = (dateString?: string) => {
    if (!dateString) return 'Unknown'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Add role check for UI elements
  const canManageClasses = userProfile && userProfile.roles &&
    userProfile.roles.some((role: string) => ['yoga_acharya', 'admin', 'super_admin'].includes(role))

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Show access denied message if user doesn't have required role
  if (!canManageClasses) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-red-900 mb-2">Access Denied</h3>
          <p className="text-red-700">
            You need yoga_acharya, admin, or super_admin role to manage class types.
          </p>
          <p className="text-sm text-red-600 mt-2">
            Current roles: {userProfile?.roles?.join(', ') || 'No roles assigned'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <Award className="w-6 h-6 mr-2" />
          Class Type Manager
          <span className="ml-2 text-sm bg-blue-100 text-blue-600 px-2 py-1 rounded">
            {userProfile?.roles?.join(', ') || 'No roles'}
          </span>
        </h2>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-4">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'active'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Active Classes ({classTypes.length})
            </button>
            <button
              onClick={() => setActiveTab('archived')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'archived'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <Archive className="w-4 h-4 mr-1 inline" />
              Archived ({archivedClassTypes.length})
            </button>
          </div>

          {activeTab === 'active' && (
            <Button
              onClick={() => setShowForm(true)}
              className="flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Class Type
            </Button>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingClassType ? 'Edit Class Type' : 'Add New Class Type'}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {errors.general && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{errors.general}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="e.g., Hatha Yoga, Vinyasa Flow"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.description ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="Describe the class style, benefits, and what students can expect"
                />
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Difficulty Level *
                  </label>
                  <select
                    value={formData.difficulty_level}
                    onChange={(e) => handleInputChange('difficulty_level', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {difficultyLevels.map(level => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="1"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.price ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="800"
                  />
                  {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
                  <p className="text-xs text-gray-500 mt-1">Weekly classes for ₹800/month</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (minutes) *
                  </label>
                  <input
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => handleInputChange('duration_minutes', parseInt(e.target.value) || 0)}
                    min="15"
                    max="180"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.duration_minutes ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                  {errors.duration_minutes && <p className="text-red-500 text-sm mt-1">{errors.duration_minutes}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Participants *
                  </label>
                  <input
                    type="number"
                    value={formData.max_participants}
                    onChange={(e) => handleInputChange('max_participants', parseInt(e.target.value) || 0)}
                    min="1"
                    max="50"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.max_participants ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                  {errors.max_participants && <p className="text-red-500 text-sm mt-1">{errors.max_participants}</p>}
                </div>

                <div className="flex items-center pt-6">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => handleInputChange('is_active', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                    Active Class Type
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={saving}
                  className="flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : (editingClassType ? 'Update' : 'Create')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Active Classes Tab */}
      {activeTab === 'active' && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {classTypes.length === 0 ? (
            <div className="text-center py-12">
              <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No active class types</h3>
              <p className="text-gray-600 mb-4">Create your first class type to get started.</p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Class Type
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {classTypes.map((classType) => (
                <div
                  key={classType.id}
                  className={`border rounded-lg p-6 hover:shadow-md transition-shadow ${classType.is_active ? 'border-gray-200' : 'border-gray-300 bg-gray-50'
                    }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{classType.name}</h3>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleEdit(classType)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleArchive(classType.id!)}
                        className="text-orange-600 hover:text-orange-800 p-1"
                        title="Archive Class"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-4">{classType.description}</p>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Difficulty:</span>
                      <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(classType.difficulty_level)}`}>
                        {classType.difficulty_level}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Price:</span>
                      <span className="font-semibold text-green-600">{formatPrice(classType.price)}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Duration:</span>
                      <span className="text-sm">{classType.duration_minutes} min</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Max Participants:</span>
                      <span className="text-sm">{classType.max_participants}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Status:</span>
                      <span className={`px-2 py-1 rounded text-xs ${classType.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                        }`}>
                        {classType.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {classType.price === 800 && (
                    <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                      💡 Weekly classes for ₹800/month
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Archived Classes Tab */}
      {activeTab === 'archived' && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {archivedClassTypes.length === 0 ? (
            <div className="text-center py-12">
              <Archive className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No archived class types</h3>
              <p className="text-gray-600">Archived class types will appear here for future reference.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {archivedClassTypes.map((classType) => (
                <div
                  key={classType.id}
                  className="border border-orange-200 bg-orange-50 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{classType.name}</h3>
                      <p className="text-xs text-orange-600 mt-1">
                        📦 Archived on {formatArchiveDate(classType.archived_at)}
                      </p>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleEdit(classType)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleUnarchive(classType.id!)}
                        className="text-green-600 hover:text-green-800 p-1"
                        title="Restore from Archive"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-4">{classType.description}</p>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Difficulty:</span>
                      <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(classType.difficulty_level)}`}>
                        {classType.difficulty_level}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Price:</span>
                      <span className="font-semibold text-green-600">{formatPrice(classType.price)}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Duration:</span>
                      <span className="text-sm">{classType.duration_minutes} min</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Max Participants:</span>
                      <span className="text-sm">{classType.max_participants}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Status:</span>
                      <span className="px-2 py-1 rounded text-xs bg-orange-100 text-orange-800">
                        Archived
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 p-2 bg-orange-100 border border-orange-200 rounded text-xs text-orange-800">
                    📦 This class is archived. Click restore to make it active again.
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ClassTypeManager;