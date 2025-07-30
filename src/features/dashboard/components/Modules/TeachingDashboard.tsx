import { 
  Calendar, 
  DollarSign, 
  Filter,
  RefreshCw,
  TrendingUp,
  AlertCircle
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../../../shared/components/ui/Button'
import { LoadingSpinner } from '../../../../shared/components/ui/LoadingSpinner'
import { useAuth } from '../../../auth/contexts/AuthContext'
import { useClassAssignments } from '../../../instructor/hooks/useClassAssignments'
import { useInstructorEarnings } from '../../../instructor/hooks/useInstructorEarnings'
import { AssignmentCard } from '../../../instructor/components/AssignmentCard'
import { AssignmentActions } from '../../../instructor/components/AssignmentActions'
import { EarningsOverview } from '../../../instructor/components/EarningsOverview'

type FilterStatus = 'all' | 'pending' | 'accepted' | 'rejected' | 'completed'

export default function TeachingDashboard() {
  const { user } = useAuth()
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [dateRange, setDateRange] = useState({
    from: new Date(), // Start from today
    to: new Date(new Date().getFullYear() + 1, 11, 31) // End at end of next year
  })

  // Debug: Log user information
  console.log('Teaching Dashboard - Current user:', user)
  console.log('Teaching Dashboard - User ID:', user?.id)
  console.log('Teaching Dashboard - Date range:', dateRange)
  console.log('Teaching Dashboard - Date range from:', dateRange.from.toISOString().split('T')[0])
  console.log('Teaching Dashboard - Date range to:', dateRange.to.toISOString().split('T')[0])
  const [showEarnings, setShowEarnings] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null)

  const { 
    assignments, 
    loading: assignmentsLoading, 
    error: assignmentsError,
    refetch: refetchAssignments,
    updateAssignmentStatus
  } = useClassAssignments(user?.id) // Fetch all assignments, filter on client side

  const { 
    monthlyEarnings, 
    yearlyEarnings, 
    loading: earningsLoading 
  } = useInstructorEarnings(user?.id)

  // Debug: Log all assignments and their statuses
  console.log('All assignments:', assignments)
  console.log('Assignment statuses:', assignments?.map(a => ({ id: a.id, status: a.instructor_status })))
  console.log('Current filter status:', filterStatus)

  // Filter assignments by status
  const filteredAssignments = assignments?.filter(assignment => {
    if (filterStatus === 'all') return true
    return assignment.instructor_status === filterStatus || 
           (filterStatus === 'pending' && !assignment.instructor_status)
  }) || []

  console.log('Filtered assignments:', filteredAssignments)
  console.log('Filtered assignment count:', filteredAssignments.length)
  
  // Debug: Check for rejected assignments specifically
  const rejectedAssignments = assignments?.filter(a => a.instructor_status === 'rejected') || []
  console.log('Rejected assignments:', rejectedAssignments)
  console.log('Rejected assignments count:', rejectedAssignments.length)

  const pendingCount = assignments?.filter(a => 
    a.instructor_status === 'pending' || !a.instructor_status
  ).length || 0

  const rejectedCount = assignments?.filter(a => 
    a.instructor_status === 'rejected'
  ).length || 0

  const acceptedCount = assignments?.filter(a => 
    a.instructor_status === 'accepted'
  ).length || 0

  const completedCount = assignments?.filter(a => 
    a.class_status === 'completed'
  ).length || 0

  console.log('Assignment counts:', { 
    total: assignments?.length || 0, 
    pending: pendingCount, 
    rejected: rejectedCount, 
    accepted: acceptedCount, 
    completed: completedCount 
  })

  const thisMonthEarnings = monthlyEarnings?.find(m => 
    m.month === new Date().getMonth() + 1 && 
    m.year === new Date().getFullYear()
  )

  const handleAssignmentAction = async (assignmentId: string, action: string, data?: any) => {
    try {
      await updateAssignmentStatus(assignmentId, action, data)
      setSelectedAssignment(null)
      refetchAssignments()
    } catch (error) {
      console.error('Failed to update assignment:', error)
    }
  }

  if (assignmentsLoading && !assignments) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Teaching Dashboard
              </h1>
              <p className="text-gray-600 dark:text-slate-300">
                Manage your class assignments and track your earnings
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowEarnings(!showEarnings)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <DollarSign className="w-4 h-4" />
                {showEarnings ? 'Hide' : 'Show'} Earnings
              </Button>
              <Button
                onClick={refetchAssignments}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Pending Assignments</p>
                  <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{pendingCount}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-orange-500 dark:text-orange-400" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-slate-400">This Month's Classes</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {thisMonthEarnings?.total_classes || 0}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-blue-500 dark:text-blue-400" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-slate-400">This Month's Earnings</p>
                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                    ₹{thisMonthEarnings?.total_earnings?.toLocaleString() || '0'}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-emerald-500 dark:text-emerald-400" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Success Rate</p>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {assignments?.length ? 
                      Math.round((assignments.filter(a => a.class_status === 'completed').length / assignments.length) * 100) 
                      : 0}%
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Earnings Overview */}
        {showEarnings && (
          <div className="mb-8">
            <EarningsOverview 
              monthlyEarnings={monthlyEarnings}
              yearlyEarnings={yearlyEarnings}
              loading={earningsLoading}
            />
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-4">
              <Filter className="w-5 h-5 text-gray-500 dark:text-slate-400" />
              <div className="flex gap-2">
                {(['all', 'pending', 'accepted', 'rejected', 'completed'] as FilterStatus[]).map((status) => {
                  const getStatusCount = () => {
                    switch (status) {
                      case 'all': return assignments?.length || 0
                      case 'pending': return pendingCount
                      case 'accepted': return acceptedCount
                      case 'rejected': return rejectedCount
                      case 'completed': return completedCount
                      default: return 0
                    }
                  }
                  
                  return (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filterStatus === status
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)} ({getStatusCount()})
                    </button>
                  )
                })}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <input
                type="date"
                value={dateRange.from.toISOString().split('T')[0]}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: new Date(e.target.value) }))}
                className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              />
              <span className="text-gray-500 dark:text-slate-400">to</span>
              <input
                type="date"
                value={dateRange.to.toISOString().split('T')[0]}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: new Date(e.target.value) }))}
                className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Assignments List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Class Assignments ({filteredAssignments.length})
            </h2>
          </div>

          {assignmentsError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
              <p className="text-red-600 dark:text-red-400">
                Error loading assignments: {assignmentsError}
              </p>
            </div>
          )}

          {filteredAssignments.length === 0 && !assignmentsLoading ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-400 dark:text-slate-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No assignments found
              </h3>
              <p className="text-gray-600 dark:text-slate-400">
                {filterStatus === 'all' 
                  ? "You don't have any class assignments yet."
                  : `No ${filterStatus} assignments found for the selected date range.`
                }
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {filteredAssignments.map((assignment) => (
                <AssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  onAction={(action, data) => handleAssignmentAction(assignment.id, action, data)}
                  onViewDetails={() => setSelectedAssignment(assignment)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Assignment Details Modal */}
        {selectedAssignment && (
          <AssignmentActions
            assignment={selectedAssignment}
            onClose={() => setSelectedAssignment(null)}
            onAction={handleAssignmentAction}
          />
        )}
      </div>
    </div>
  )
}