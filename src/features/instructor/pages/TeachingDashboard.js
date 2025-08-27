import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Calendar, DollarSign, RefreshCw, TrendingUp } from 'lucide-react';
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
import { AssignmentCreationService } from '../../dashboard/components/Modules/ClassAssignmentManager/services/assignmentCreation';
import { AttendanceStatusBadge } from '../components/AttendanceStatusBadge';
import { PaymentStatusBadge } from '../components/PaymentStatusBadge';
import { RatingWidget } from '../components/RatingWidget';
export function TeachingDashboard() {
    const { user } = useAuth();
    const instructorId = user?.id;
    // UI State
    const [filterStatus, setFilterStatus] = useState('all');
    const [showEarnings, setShowEarnings] = useState(false);
    const [showPayoutSummary, setShowPayoutSummary] = useState(true);
    const [attendanceOpen, setAttendanceOpen] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [statusUpdating, setStatusUpdating] = useState(null);
    // Date range just for filtering UI (the underlying hook already constrains to next 60 days)
    const [dateRange, setDateRange] = useState({
        from: new Date(),
        to: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60) // +60 days
    });
    // Upcoming classes (next 60 days)
    const { classes, loading: upcomingLoading, error: upcomingError, refetch: refetchUpcoming, setFilters } = useUpcomingInstructorClasses(instructorId, {
        from: dateRange.from,
        to: dateRange.to,
        class_status: 'all'
    });
    // Earnings (legacy monthly/yearly)
    const { monthlyEarnings, yearlyEarnings, loading: earningsLoading } = useInstructorEarnings(instructorId);
    // Payout summary (payment status aggregation)
    const { summaries, totalFinalAmount, loading: payoutLoading, error: payoutError, refetch: refetchPayout } = usePayoutSummary(instructorId);
    // Derived stats
    const thisMonthEarnings = monthlyEarnings?.find(m => m.month === new Date().getMonth() + 1 && m.year === new Date().getFullYear());
    const filteredClasses = (classes || []).filter(c => {
        if (filterStatus === 'all')
            return true;
        if (filterStatus === 'canceled')
            return c.class_status === 'not_conducted';
        return c.class_status === filterStatus;
    });
    const successRate = (() => {
        if (!classes || classes.length === 0)
            return 0;
        const completed = classes.filter(c => c.class_status === 'completed').length;
        return Math.round((completed / classes.length) * 100);
    })();
    const handleRefreshAll = () => {
        refetchUpcoming();
        refetchPayout();
    };
    if (upcomingLoading && !classes) {
        return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center", children: _jsx(LoadingSpinner, { size: "lg" }) }));
    }
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800", children: _jsxs("div", { className: "container mx-auto px-4 py-8", children: [_jsxs("div", { className: "mb-8", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-4xl font-bold text-gray-900 dark:text-white mb-2", children: "Teaching Dashboard" }), _jsx("p", { className: "text-gray-600 dark:text-slate-300", children: "Upcoming classes (next 60 days), attendance & earnings" })] }), _jsxs("div", { className: "flex gap-3 flex-wrap", children: [_jsxs(Button, { onClick: () => setShowEarnings(v => !v), variant: "outline", className: "flex items-center gap-2", children: [_jsx(DollarSign, { className: "w-4 h-4" }), showEarnings ? 'Hide' : 'Show', " Earnings"] }), _jsxs(Button, { onClick: () => setShowPayoutSummary(v => !v), variant: "outline", className: "flex items-center gap-2", children: [_jsx(DollarSign, { className: "w-4 h-4" }), showPayoutSummary ? 'Hide' : 'Show', " Payout Summary"] }), _jsxs(Button, { onClick: handleRefreshAll, variant: "outline", className: "flex items-center gap-2", children: [_jsx(RefreshCw, { className: "w-4 h-4" }), "Refresh"] })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6 mb-8", children: [_jsx("div", { className: "bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600 dark:text-slate-400", children: "Upcoming Classes" }), _jsx("p", { className: "text-3xl font-bold text-blue-600 dark:text-blue-400", children: classes?.length || 0 })] }), _jsx(Calendar, { className: "w-8 h-8 text-blue-500 dark:text-blue-400" })] }) }), _jsx("div", { className: "bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600 dark:text-slate-400", children: "This Month's Classes" }), _jsx("p", { className: "text-3xl font-bold text-indigo-600 dark:text-indigo-400", children: thisMonthEarnings?.total_classes || 0 })] }), _jsx(TrendingUp, { className: "w-8 h-8 text-indigo-500 dark:text-indigo-400" })] }) }), _jsx("div", { className: "bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600 dark:text-slate-400", children: "This Month's Earnings" }), _jsxs("p", { className: "text-3xl font-bold text-emerald-600 dark:text-emerald-400", children: ["\u20B9", thisMonthEarnings?.total_earnings?.toLocaleString() || '0'] })] }), _jsx(DollarSign, { className: "w-8 h-8 text-emerald-500 dark:text-emerald-400" })] }) }), _jsx("div", { className: "bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600 dark:text-slate-400", children: "Success Rate" }), _jsxs("p", { className: "text-3xl font-bold text-purple-600 dark:text-purple-400", children: [successRate, "%"] })] }), _jsx(TrendingUp, { className: "w-8 h-8 text-purple-500 dark:text-purple-400" })] }) })] })] }), showEarnings && (_jsx("div", { className: "mb-8", children: _jsxs("div", { className: "bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900 dark:text-white mb-4", children: "Monthly & Yearly Earnings" }), earningsLoading && (_jsx("div", { className: "py-8 flex justify-center", children: _jsx(LoadingSpinner, {}) })), !earningsLoading && (_jsxs("div", { className: "grid gap-6 md:grid-cols-2", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-sm font-medium text-gray-600 dark:text-slate-400 mb-2", children: "Recent Months" }), _jsx("ul", { className: "space-y-2 max-h-56 overflow-auto pr-1 text-sm", children: monthlyEarnings.slice(0, 6).map(m => (_jsxs("li", { className: "flex justify-between", children: [_jsxs("span", { children: [m.year, "-", String(m.month).padStart(2, '0')] }), _jsxs("span", { className: "font-medium text-emerald-600 dark:text-emerald-400", children: ["\u20B9", m.total_earnings.toFixed(2)] })] }, `${m.year}-${m.month}`))) })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-medium text-gray-600 dark:text-slate-400 mb-2", children: "Yearly" }), _jsx("ul", { className: "space-y-2 text-sm", children: yearlyEarnings.map(y => (_jsxs("li", { className: "flex justify-between", children: [_jsx("span", { children: y.year }), _jsxs("span", { className: "font-medium text-emerald-600 dark:text-emerald-400", children: ["\u20B9", y.total_earnings.toFixed(2)] })] }, y.year))) })] })] }))] }) })), showPayoutSummary && (_jsx("div", { className: "mb-8", children: _jsxs("div", { className: "bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900 dark:text-white", children: "Payout Summary (Window)" }), payoutLoading && _jsx(LoadingSpinner, { size: "sm" })] }), payoutError && (_jsxs("div", { className: "text-sm text-red-600 dark:text-red-400 mb-4", children: ["Error: ", payoutError] })), _jsxs("div", { className: "flex flex-wrap gap-3", children: [summaries.map(s => (_jsxs("div", { className: "flex items-center gap-2 bg-gray-50 dark:bg-slate-700/40 border border-gray-200 dark:border-slate-600 rounded-lg px-4 py-2 text-sm", children: [_jsx(PaymentStatusBadge, { status: s.payment_status, showAmount: true, amount: s.total_amount }), _jsxs("span", { className: "text-xs text-gray-600 dark:text-slate-400", children: [s.class_count, " ", s.class_count === 1 ? 'class' : 'classes'] })] }, s.payment_status))), _jsxs("div", { className: "ml-auto flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-300", children: ["Total: ", _jsxs("span", { className: "text-emerald-600 dark:text-emerald-400", children: ["\u20B9", totalFinalAmount.toFixed(2)] })] })] })] }) })), _jsx("div", { className: "bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-6 mb-8", children: _jsxs("div", { className: "flex flex-col lg:flex-row gap-6 justify-between", children: [_jsxs("div", { className: "flex flex-col gap-2", children: [_jsx("span", { className: "flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-slate-400", children: "Filter Status" }), _jsx("div", { className: "flex flex-wrap gap-2", children: ['all', 'scheduled', 'completed', 'canceled'].map(status => (_jsx("button", { onClick: () => setFilterStatus(status), className: `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === status
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'}`, children: status.charAt(0).toUpperCase() + status.slice(1) }, status))) })] }), _jsxs("div", { className: "flex flex-col gap-2", children: [_jsx("span", { className: "text-sm font-medium text-gray-600 dark:text-slate-400", children: "Date Range (applies to upcoming view)" }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("input", { type: "date", value: dateRange.from.toISOString().split('T')[0], onChange: e => {
                                                    const d = new Date(e.target.value);
                                                    setDateRange(prev => ({ ...prev, from: d }));
                                                    setFilters({ from: d });
                                                }, className: "px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white" }), _jsx("span", { className: "text-gray-500 dark:text-slate-400", children: "to" }), _jsx("input", { type: "date", value: dateRange.to.toISOString().split('T')[0], onChange: e => {
                                                    const d = new Date(e.target.value);
                                                    setDateRange(prev => ({ ...prev, to: d }));
                                                    setFilters({ to: d });
                                                }, className: "px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white" })] })] })] }) }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("h2", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: ["Upcoming Classes (", filteredClasses.length, ")"] }), upcomingError && (_jsx("span", { className: "text-sm text-red-600 dark:text-red-400", children: upcomingError }))] }), filteredClasses.length === 0 && !upcomingLoading ? (_jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-12 text-center", children: [_jsx(Calendar, { className: "w-16 h-16 text-gray-400 dark:text-slate-500 mx-auto mb-4" }), _jsx("h3", { className: "text-xl font-semibold text-gray-900 dark:text-white mb-2", children: "No classes found" }), _jsx("p", { className: "text-gray-600 dark:text-slate-400", children: filterStatus === 'all'
                                        ? 'You have no upcoming classes in the selected window.'
                                        : `No ${filterStatus} classes found for the selected range.` })] })) : (_jsx("div", { className: "grid gap-6", children: filteredClasses.map(c => {
                                const start = `${c.date} ${c.start_time}`;
                                const end = c.end_time;
                                return (_jsx("div", { className: "bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-5 flex flex-col gap-4", children: _jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [_jsxs("div", { className: "flex flex-col", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: [
                                                            c.schedule_type,
                                                            c.booking_type,
                                                            c.class_types?.name
                                                        ].filter(Boolean).join(' | ') + (c.participant_count ? ` | Participants - ${c.participant_count}` : '') }), _jsxs("p", { className: "text-sm text-gray-600 dark:text-slate-400", children: [start, " \u2022 ", end] }), _jsxs("div", { className: "mt-2 flex flex-wrap gap-2 items-center", children: [_jsx(AttendanceStatusBadge, { status: c.class_status === 'completed' ? 'present' : c.class_status === 'canceled' ? 'canceled_by_instructor' : 'present', compact: true }), _jsx(PaymentStatusBadge, { status: c.payment_status, amount: c.final_payment_amount ?? c.override_payment_amount ?? c.payment_amount ?? 0, compact: true }), _jsxs("span", { className: "text-xs text-gray-500 dark:text-slate-400", children: ["Present: ", c.present_count, " \u2022 No-Show: ", c.no_show_count] }), c.rating_count > 0 && (_jsxs("span", { className: "text-xs text-gray-500 dark:text-slate-400", children: ["Avg Rating: ", c.avg_rating?.toFixed(2), " (", c.rating_count, ")"] }))] }), _jsxs("div", { className: "mt-2", children: [_jsx("label", { className: "text-xs text-gray-500 dark:text-slate-400 mr-2", children: "Class Status:" }), _jsxs("select", { value: c.class_status, disabled: statusUpdating === c.assignment_id, onChange: async (e) => {
                                                                    const newStatus = e.target.value;
                                                                    setStatusUpdating(c.assignment_id);
                                                                    try {
                                                                        await AssignmentCreationService.updateBookingStatus(c.assignment_id, newStatus);
                                                                        refetchUpcoming();
                                                                    }
                                                                    catch (err) {
                                                                        alert('Failed to update class status');
                                                                    }
                                                                    setStatusUpdating(null);
                                                                }, className: "px-2 py-1 rounded border border-gray-300 dark:border-slate-600 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white", children: [_jsx("option", { value: "scheduled", children: "Scheduled" }), _jsx("option", { value: "completed", children: "Completed" }), _jsx("option", { value: "not_conducted", children: "Canceled" })] }), statusUpdating === c.assignment_id && (_jsx("span", { className: "ml-2 text-xs text-blue-500", children: "Updating..." }))] })] }), _jsxs("div", { className: "flex flex-col items-end gap-2", children: [_jsxs("div", { className: "text-sm font-medium text-emerald-600 dark:text-emerald-400", children: ["\u20B9", (c.final_payment_amount ??
                                                                c.override_payment_amount ??
                                                                c.payment_amount ??
                                                                0).toFixed(2)] }), _jsx(RatingWidget, { assignmentId: c.assignment_id, size: 18, showAggregate: true, className: "min-w-[160px]" }), _jsx("button", { onClick: () => { setSelectedAssignment(c); setAttendanceOpen(true); }, className: "px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white", children: "Attendance" })] })] }) }, c.assignment_id));
                            }) }))] }), _jsx(AssignmentAttendanceModal, { open: attendanceOpen, onClose: () => setAttendanceOpen(false), assignment: selectedAssignment })] }) }));
}
