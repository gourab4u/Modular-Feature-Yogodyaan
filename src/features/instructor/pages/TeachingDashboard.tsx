import {
  Calendar,
  DollarSign,
  RefreshCw,
  TrendingUp
} from 'lucide-react';
import { useState } from 'react';
import { AssignmentAttendanceModal } from '../components/AssignmentAttendanceModal';

import { Button } from '../../../shared/components/ui/Button';
import { LoadingSpinner } from '../../../shared/components/ui/LoadingSpinner';
import { useAuth } from '../../auth/contexts/AuthContext';

// NEW hooks (upcoming classes / payout summary / earnings legacy)
import { useInstructorEarnings } from '../hooks/useInstructorEarnings';
import { usePayoutSummary } from '../hooks/usePayoutSummary';
import { useUpcomingInstructorClasses } from '../hooks/useUpcomingInstructorClasses';

// NEW components
import { AttendanceStatusBadge } from '../components/AttendanceStatusBadge';
import { PaymentStatusBadge } from '../components/PaymentStatusBadge';
import { RatingWidget } from '../components/RatingWidget';

// Legacy (kept temporarily for any existing analytics – can be removed later)
// import { useClassAssignments } from '../hooks/useClassAssignments';
// import { AssignmentCard } from '../components/AssignmentCard';
// import { AssignmentActions } from '../components/AssignmentActions';

type ClassFilterStatus = 'all' | 'scheduled' | 'completed' | 'canceled' | 'rescheduled';

export function TeachingDashboard() {
  const { user } = useAuth();
  const instructorId = user?.id;

  // UI State
  const [filterStatus, setFilterStatus] = useState<ClassFilterStatus>('all');
  const [showEarnings, setShowEarnings] = useState(false);
  const [showPayoutSummary, setShowPayoutSummary] = useState(true);
  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);

  // Date range just for filtering UI (the underlying hook already constrains to next 60 days)
  const [dateRange, setDateRange] = useState({
    from: new Date(),
    to: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60) // +60 days
  });

  // Upcoming classes (next 60 days)
  const {
    classes,
    loading: upcomingLoading,
    error: upcomingError,
    refetch: refetchUpcoming,
    setFilters
  } = useUpcomingInstructorClasses(instructorId, {
    from: dateRange.from,
    to: dateRange.to,
    class_status: 'all'
  });

  // Earnings (legacy monthly/yearly)
  const {
    monthlyEarnings,
    yearlyEarnings,
    loading: earningsLoading
  } = useInstructorEarnings(instructorId);

  // Payout summary (payment status aggregation)
  const {
    summaries,
    totalFinalAmount,
    loading: payoutLoading,
    error: payoutError,
    refetch: refetchPayout
  } = usePayoutSummary(instructorId);

  // Derived stats
  const thisMonthEarnings = monthlyEarnings?.find(
    m => m.month === new Date().getMonth() + 1 && m.year === new Date().getFullYear()
  );

  const filteredClasses = (classes || []).filter(c => {
    if (filterStatus === 'all') return true;
    return c.class_status === filterStatus;
  });

  const successRate = (() => {
    if (!classes || classes.length === 0) return 0;
    const completed = classes.filter(c => c.class_status === 'completed').length;
    return Math.round((completed / classes.length) * 100);
  })();

  const handleRefreshAll = () => {
    refetchUpcoming();
    refetchPayout();
  };

  if (upcomingLoading && !classes) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
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
                Upcoming classes (next 60 days), attendance & earnings
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Button
                onClick={() => setShowEarnings(v => !v)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <DollarSign className="w-4 h-4" />
                {showEarnings ? 'Hide' : 'Show'} Earnings
              </Button>
              <Button
                onClick={() => setShowPayoutSummary(v => !v)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <DollarSign className="w-4 h-4" />
                {showPayoutSummary ? 'Hide' : 'Show'} Payout Summary
              </Button>
              <Button
                onClick={handleRefreshAll}
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
                  <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Upcoming Classes</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {classes?.length || 0}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-blue-500 dark:text-blue-400" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-slate-400">This Month's Classes</p>
                  <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                    {thisMonthEarnings?.total_classes || 0}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />
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
                    {successRate}%
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Earnings Overview (legacy) */}
        {showEarnings && (
          <div className="mb-8">
            {/* Reusing existing component structure kept previously (if removed, replace with charts) */}
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Monthly & Yearly Earnings
              </h2>
              {earningsLoading && (
                <div className="py-8 flex justify-center">
                  <LoadingSpinner />
                </div>
              )}
              {!earningsLoading && (
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 dark:text-slate-400 mb-2">Recent Months</h3>
                    <ul className="space-y-2 max-h-56 overflow-auto pr-1 text-sm">
                      {monthlyEarnings.slice(0, 6).map(m => (
                        <li key={`${m.year}-${m.month}`} className="flex justify-between">
                          <span>{m.year}-{String(m.month).padStart(2, '0')}</span>
                          <span className="font-medium text-emerald-600 dark:text-emerald-400">₹{m.total_earnings.toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 dark:text-slate-400 mb-2">Yearly</h3>
                    <ul className="space-y-2 text-sm">
                      {yearlyEarnings.map(y => (
                        <li key={y.year} className="flex justify-between">
                          <span>{y.year}</span>
                          <span className="font-medium text-emerald-600 dark:text-emerald-400">₹{y.total_earnings.toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payout Summary */}
        {showPayoutSummary && (
          <div className="mb-8">
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Payout Summary (Window)
                </h2>
                {payoutLoading && <LoadingSpinner size="sm" />}
              </div>
              {payoutError && (
                <div className="text-sm text-red-600 dark:text-red-400 mb-4">
                  Error: {payoutError}
                </div>
              )}
              <div className="flex flex-wrap gap-3">
                {summaries.map(s => (
                  <div
                    key={s.payment_status}
                    className="flex items-center gap-2 bg-gray-50 dark:bg-slate-700/40 border border-gray-200 dark:border-slate-600 rounded-lg px-4 py-2 text-sm"
                  >
                    <PaymentStatusBadge status={s.payment_status} showAmount amount={s.total_amount} />
                    <span className="text-xs text-gray-600 dark:text-slate-400">
                      {s.class_count} {s.class_count === 1 ? 'class' : 'classes'}
                    </span>
                  </div>
                ))}
                <div className="ml-auto flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-300">
                  Total: <span className="text-emerald-600 dark:text-emerald-400">₹{totalFinalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-6 justify-between">
            <div className="flex flex-col gap-2">
              <span className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-slate-400">
                Filter Status
              </span>
              <div className="flex flex-wrap gap-2">
                {(['all', 'scheduled', 'completed', 'canceled', 'rescheduled'] as ClassFilterStatus[]).map(status => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                      }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-gray-600 dark:text-slate-400">
                Date Range (applies to upcoming view)
              </span>
              <div className="flex items-center gap-3">
                <input
                  type="date"
                  value={dateRange.from.toISOString().split('T')[0]}
                  onChange={e => {
                    const d = new Date(e.target.value);
                    setDateRange(prev => ({ ...prev, from: d }));
                    setFilters({ from: d });
                  }}
                  className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                />
                <span className="text-gray-500 dark:text-slate-400">to</span>
                <input
                  type="date"
                  value={dateRange.to.toISOString().split('T')[0]}
                  onChange={e => {
                    const d = new Date(e.target.value);
                    setDateRange(prev => ({ ...prev, to: d }));
                    setFilters({ to: d });
                  }}
                  className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Classes List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Upcoming Classes ({filteredClasses.length})
            </h2>
            {upcomingError && (
              <span className="text-sm text-red-600 dark:text-red-400">
                {upcomingError}
              </span>
            )}
          </div>

          {filteredClasses.length === 0 && !upcomingLoading ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-400 dark:text-slate-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No classes found
              </h3>
              <p className="text-gray-600 dark:text-slate-400">
                {filterStatus === 'all'
                  ? 'You have no upcoming classes in the selected window.'
                  : `No ${filterStatus} classes found for the selected range.`}
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {filteredClasses.map(c => {
                const start = `${c.date} ${c.start_time}`;
                const end = c.end_time;
                return (
                  <div
                    key={c.assignment_id}
                    className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-5 flex flex-col gap-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex flex-col">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {(c as any).class_types?.name || 'Class'}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-slate-400">
                          {start} • {end}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2 items-center">
                          <AttendanceStatusBadge
                            status={c.class_status === 'completed' ? 'present' : c.class_status === 'canceled' ? 'canceled_by_instructor' : 'present'}
                            compact
                          />
                          <PaymentStatusBadge
                            status={c.payment_status}
                            amount={c.final_payment_amount ?? c.override_payment_amount ?? c.payment_amount ?? 0}
                            compact
                          />
                          <span className="text-xs text-gray-500 dark:text-slate-400">
                            Present: {c.present_count} • No-Show: {c.no_show_count}
                          </span>
                          {c.rating_count > 0 && (
                            <span className="text-xs text-gray-500 dark:text-slate-400">
                              Avg Rating: {c.avg_rating?.toFixed(2)} ({c.rating_count})
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                          ₹{(c.final_payment_amount ??
                            c.override_payment_amount ??
                            c.payment_amount ??
                            0).toFixed(2)}
                        </div>
                        <RatingWidget
                          assignmentId={c.assignment_id}
                          size={18}
                          showAggregate
                          className="min-w-[160px]"
                        />
                        <button
                          onClick={() => { setSelectedAssignment(c); setAttendanceOpen(true); }}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Attendance
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Legacy modal / actions area could go here if needed */}
        <AssignmentAttendanceModal
          open={attendanceOpen}
          onClose={() => setAttendanceOpen(false)}
          assignment={selectedAssignment}
        />
      </div>
    </div>
  );
}
