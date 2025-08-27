import { 
  X, 
  CheckCircle, 
  XCircle, 
  Calendar
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../../shared/components/ui/Button'

interface AssignmentActionsProps {
  assignment: any
  onClose: () => void
  onAction: (assignmentId: string, action: string, data?: any) => void
}

export function AssignmentActions({ assignment, onClose, onAction }: AssignmentActionsProps) {
  const [activeTab, setActiveTab] = useState('details')
  const [actionData, setActionData] = useState({
    remarks: '',
    rejectionReason: '',
    rescheduleDate: '',
    rescheduleTime: '',
    rescheduleReason: ''
  })
  const [loading, setLoading] = useState(false)

  const handleAction = async (action: string) => {
    setLoading(true)
    try {
      let data = {}
      
      if (action === 'accept') {
        data = { instructor_remarks: actionData.remarks }
      } else if (action === 'reject') {
        data = { 
          rejection_reason: actionData.rejectionReason,
          instructor_remarks: actionData.remarks 
        }
      } else if (action === 'reschedule') {
        console.log('Reschedule action triggered with actionData:', actionData)
        data = {
          reschedule_requested_date: actionData.rescheduleDate,
          reschedule_requested_time: actionData.rescheduleTime,
          reschedule_reason: actionData.rescheduleReason,
          instructor_remarks: actionData.remarks
        }
        console.log('Reschedule data prepared:', data)
      }
      
      await onAction(assignment.id, action, data)
    } finally {
      setLoading(false)
    }
  }

  const isPending = !assignment.instructor_status || assignment.instructor_status === 'pending'
  const isWeeklySchedule = assignment.schedule_type === 'weekly'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-600">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Class Assignment Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-slate-600">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'details'
                ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Details
          </button>
          {isPending && !isWeeklySchedule && (
            <button
              onClick={() => setActiveTab('actions')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'actions'
                  ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Actions
            </button>
          )}
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Class Information */}
              <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Class Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-slate-400">Class Type:</span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {assignment.class_types?.name || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-slate-400">Schedule Type:</span>
                    <p className="font-medium text-gray-900 dark:text-white capitalize">
                      {assignment.schedule_type}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-slate-400">Date:</span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {new Date(assignment.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-slate-400">Time:</span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {assignment.start_time} - {assignment.end_time}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-slate-400">Payment:</span>
                    <p className="font-medium text-emerald-600 dark:text-emerald-400">
                      ₹{assignment.payment_amount}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-slate-400">Status:</span>
                    <p className="font-medium text-gray-900 dark:text-white capitalize">
                      {assignment.instructor_status || 'Pending'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Assignment Notes */}
              {assignment.notes && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Assignment Notes</h3>
                  <p className="text-gray-700 dark:text-slate-300">{assignment.notes}</p>
                </div>
              )}

              {/* Class Description */}
              {assignment.class_types?.description && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Class Description</h3>
                  <p className="text-gray-700 dark:text-slate-300">{assignment.class_types.description}</p>
                </div>
              )}

              {/* Rejection Information */}
              {assignment.instructor_status === 'rejected' && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Assignment Rejected</h3>
                  {assignment.rejection_reason && (
                    <div className="mb-3">
                      <span className="text-gray-600 dark:text-slate-400">Rejection Reason:</span>
                      <p className="font-medium text-red-600 dark:text-red-400 mt-1">
                        {assignment.rejection_reason.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                    </div>
                  )}
                  {assignment.instructor_response_at && (
                    <div>
                      <span className="text-gray-600 dark:text-slate-400">Rejected On:</span>
                      <p className="text-gray-700 dark:text-slate-300 mt-1">
                        {new Date(assignment.instructor_response_at).toLocaleDateString()} at {new Date(assignment.instructor_response_at).toLocaleTimeString()}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Reschedule Information */}
              {assignment.instructor_status === 'rescheduled' && (
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Reschedule Request</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {assignment.reschedule_requested_date && (
                      <div>
                        <span className="text-gray-600 dark:text-slate-400">Requested Date:</span>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {new Date(assignment.reschedule_requested_date).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {assignment.reschedule_requested_time && (
                      <div>
                        <span className="text-gray-600 dark:text-slate-400">Requested Time:</span>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {assignment.reschedule_requested_time}
                        </p>
                      </div>
                    )}
                  </div>
                  {assignment.reschedule_reason && (
                    <div className="mt-3">
                      <span className="text-gray-600 dark:text-slate-400">Reason:</span>
                      <p className="text-gray-700 dark:text-slate-300 mt-1">{assignment.reschedule_reason}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Your Remarks */}
              {assignment.instructor_remarks && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Your Remarks</h3>
                  <p className="text-gray-700 dark:text-slate-300">{assignment.instructor_remarks}</p>
                </div>
              )}
            </div>
          )}

          {/* Actions Tab */}
          {activeTab === 'actions' && isPending && !isWeeklySchedule && (
            <div className="space-y-6">
              {/* Accept Action */}
              <div className="border border-emerald-200 dark:border-emerald-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="font-semibold text-emerald-700 dark:text-emerald-300">Accept Assignment</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-3">
                  Accept this class assignment and optionally add remarks.
                </p>
                <textarea
                  value={actionData.remarks}
                  onChange={(e) => setActionData(prev => ({ ...prev, remarks: e.target.value }))}
                  placeholder="Add any remarks or notes (optional)"
                  className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  rows={3}
                />
                <Button
                  onClick={() => handleAction('accept')}
                  disabled={loading}
                  className="mt-3 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {loading ? 'Processing...' : 'Accept Assignment'}
                </Button>
              </div>

              {/* Reject Action */}
              <div className="border border-red-200 dark:border-red-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <h3 className="font-semibold text-red-700 dark:text-red-300">Reject Assignment</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-3">
                  Decline this class assignment with a reason.
                </p>
                <select
                  value={actionData.rejectionReason}
                  onChange={(e) => setActionData(prev => ({ ...prev, rejectionReason: e.target.value }))}
                  className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white mb-3"
                >
                  <option value="">Select reason for rejection</option>
                  <option value="scheduling_conflict">Scheduling Conflict</option>
                  <option value="personal_unavailable">Personal Unavailability</option>
                  <option value="class_type_mismatch">Not My Expertise</option>
                  <option value="short_notice">Too Short Notice</option>
                  <option value="other">Other</option>
                </select>
                <textarea
                  value={actionData.remarks}
                  onChange={(e) => setActionData(prev => ({ ...prev, remarks: e.target.value }))}
                  placeholder="Additional comments (optional)"
                  className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  rows={2}
                />
                <Button
                  onClick={() => handleAction('reject')}
                  disabled={loading || !actionData.rejectionReason}
                  variant="outline"
                  className="mt-3 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-600 dark:text-red-400"
                >
                  {loading ? 'Processing...' : 'Reject Assignment'}
                </Button>
              </div>

              {/* Reschedule Action */}
              <div className="border border-purple-200 dark:border-purple-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <h3 className="font-semibold text-purple-700 dark:text-purple-300">Request Reschedule</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-3">
                  Request to reschedule this class to a different date/time.
                </p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                      Preferred Date
                    </label>
                    <input
                      type="date"
                      value={actionData.rescheduleDate}
                      onChange={(e) => setActionData(prev => ({ ...prev, rescheduleDate: e.target.value }))}
                      className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                      Preferred Time
                    </label>
                    <input
                      type="time"
                      value={actionData.rescheduleTime}
                      onChange={(e) => setActionData(prev => ({ ...prev, rescheduleTime: e.target.value }))}
                      className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                <textarea
                  value={actionData.rescheduleReason}
                  onChange={(e) => setActionData(prev => ({ ...prev, rescheduleReason: e.target.value }))}
                  placeholder="Reason for reschedule request"
                  className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white mb-3"
                  rows={2}
                />
                <Button
                  onClick={() => handleAction('reschedule')}
                  disabled={loading || !actionData.rescheduleDate || !actionData.rescheduleTime}
                  variant="outline"
                  className="border-purple-300 text-purple-600 hover:bg-purple-50 dark:border-purple-600 dark:text-purple-400"
                >
                  {loading ? 'Processing...' : 'Request Reschedule'}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-slate-600">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}