import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Calendar, DollarSign, Filter, RefreshCw, TrendingUp, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../../shared/components/ui/Button';
import { LoadingSpinner } from '../../../shared/components/ui/LoadingSpinner';
import { useAuth } from '../../auth/contexts/AuthContext';
import { useClassAssignments } from '../hooks/useClassAssignments';
import { useInstructorEarnings } from '../hooks/useInstructorEarnings';
import { AssignmentCard } from '../components/AssignmentCard';
import { AssignmentActions } from '../components/AssignmentActions';
import { EarningsOverview } from '../components/EarningsOverview';
export function TeachingDashboard() {
    const { user } = useAuth();
    const [filterStatus, setFilterStatus] = useState('all');
    const [dateRange, setDateRange] = useState({
        from: new Date(), // Start from today
        to: new Date(new Date().getFullYear() + 1, 11, 31) // End at end of next year
    });
    // Debug: Log user information
    console.log('Teaching Dashboard - Current user:', user);
    console.log('Teaching Dashboard - User ID:', user?.id);
    console.log('Teaching Dashboard - Date range:', dateRange);
    console.log('Teaching Dashboard - Date range from:', dateRange.from.toISOString().split('T')[0]);
    console.log('Teaching Dashboard - Date range to:', dateRange.to.toISOString().split('T')[0]);
    const [showEarnings, setShowEarnings] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const { assignments, loading: assignmentsLoading, error: assignmentsError, refetch: refetchAssignments, updateAssignmentStatus } = useClassAssignments(user?.id, filterStatus); // Temporarily remove dateRange to test
    const { monthlyEarnings, yearlyEarnings, loading: earningsLoading } = useInstructorEarnings(user?.id);
    // Filter assignments by status
    const filteredAssignments = assignments?.filter(assignment => {
        if (filterStatus === 'all')
            return true;
        return assignment.instructor_status === filterStatus ||
            (filterStatus === 'pending' && !assignment.instructor_status);
    }) || [];
    const pendingCount = assignments?.filter(a => a.instructor_status === 'pending' || !a.instructor_status).length || 0;
    const thisMonthEarnings = monthlyEarnings?.find(m => m.month === new Date().getMonth() + 1 &&
        m.year === new Date().getFullYear());
    const handleAssignmentAction = async (assignmentId, action, data) => {
        try {
            await updateAssignmentStatus(assignmentId, action, data);
            setSelectedAssignment(null);
            refetchAssignments();
        }
        catch (error) {
            console.error('Failed to update assignment:', error);
        }
    };
    if (assignmentsLoading && !assignments) {
        return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center", children: _jsx(LoadingSpinner, { size: "lg" }) }));
    }
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800", children: _jsxs("div", { className: "container mx-auto px-4 py-8", children: [_jsxs("div", { className: "mb-8", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-4xl font-bold text-gray-900 dark:text-white mb-2", children: "Teaching Dashboard" }), _jsx("p", { className: "text-gray-600 dark:text-slate-300", children: "Manage your class assignments and track your earnings" })] }), _jsxs("div", { className: "flex gap-3", children: [_jsxs(Button, { onClick: () => setShowEarnings(!showEarnings), variant: "outline", className: "flex items-center gap-2", children: [_jsx(DollarSign, { className: "w-4 h-4" }), showEarnings ? 'Hide' : 'Show', " Earnings"] }), _jsxs(Button, { onClick: refetchAssignments, variant: "outline", className: "flex items-center gap-2", children: [_jsx(RefreshCw, { className: "w-4 h-4" }), "Refresh"] })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6 mb-8", children: [_jsx("div", { className: "bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600 dark:text-slate-400", children: "Pending Assignments" }), _jsx("p", { className: "text-3xl font-bold text-orange-600 dark:text-orange-400", children: pendingCount })] }), _jsx(AlertCircle, { className: "w-8 h-8 text-orange-500 dark:text-orange-400" })] }) }), _jsx("div", { className: "bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600 dark:text-slate-400", children: "This Month's Classes" }), _jsx("p", { className: "text-3xl font-bold text-blue-600 dark:text-blue-400", children: thisMonthEarnings?.total_classes || 0 })] }), _jsx(Calendar, { className: "w-8 h-8 text-blue-500 dark:text-blue-400" })] }) }), _jsx("div", { className: "bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600 dark:text-slate-400", children: "This Month's Earnings" }), _jsxs("p", { className: "text-3xl font-bold text-emerald-600 dark:text-emerald-400", children: ["\u20B9", thisMonthEarnings?.total_earnings?.toLocaleString() || '0'] })] }), _jsx(DollarSign, { className: "w-8 h-8 text-emerald-500 dark:text-emerald-400" })] }) }), _jsx("div", { className: "bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600 dark:text-slate-400", children: "Success Rate" }), _jsxs("p", { className: "text-3xl font-bold text-purple-600 dark:text-purple-400", children: [assignments?.length ?
                                                                Math.round((assignments.filter(a => a.class_status === 'completed').length / assignments.length) * 100)
                                                                : 0, "%"] })] }), _jsx(TrendingUp, { className: "w-8 h-8 text-purple-500 dark:text-purple-400" })] }) })] })] }), showEarnings && (_jsx("div", { className: "mb-8", children: _jsx(EarningsOverview, { monthlyEarnings: monthlyEarnings, yearlyEarnings: yearlyEarnings, loading: earningsLoading }) })), _jsx("div", { className: "bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-6 mb-8", children: _jsxs("div", { className: "flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx(Filter, { className: "w-5 h-5 text-gray-500 dark:text-slate-400" }), _jsx("div", { className: "flex gap-2", children: ['all', 'pending', 'accepted', 'rejected', 'completed'].map((status) => (_jsx("button", { onClick: () => setFilterStatus(status), className: `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === status
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'}`, children: status.charAt(0).toUpperCase() + status.slice(1) }, status))) })] }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsx("input", { type: "date", value: dateRange.from.toISOString().split('T')[0], onChange: (e) => setDateRange(prev => ({ ...prev, from: new Date(e.target.value) })), className: "px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white" }), _jsx("span", { className: "text-gray-500 dark:text-slate-400", children: "to" }), _jsx("input", { type: "date", value: dateRange.to.toISOString().split('T')[0], onChange: (e) => setDateRange(prev => ({ ...prev, to: new Date(e.target.value) })), className: "px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white" })] })] }) }), _jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "flex items-center justify-between", children: _jsxs("h2", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: ["Class Assignments (", filteredAssignments.length, ")"] }) }), assignmentsError && (_jsx("div", { className: "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4", children: _jsxs("p", { className: "text-red-600 dark:text-red-400", children: ["Error loading assignments: ", assignmentsError] }) })), filteredAssignments.length === 0 && !assignmentsLoading ? (_jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-12 text-center", children: [_jsx(Calendar, { className: "w-16 h-16 text-gray-400 dark:text-slate-500 mx-auto mb-4" }), _jsx("h3", { className: "text-xl font-semibold text-gray-900 dark:text-white mb-2", children: "No assignments found" }), _jsx("p", { className: "text-gray-600 dark:text-slate-400", children: filterStatus === 'all'
                                        ? "You don't have any class assignments yet."
                                        : `No ${filterStatus} assignments found for the selected date range.` })] })) : (_jsx("div", { className: "grid gap-6", children: filteredAssignments.map((assignment) => (_jsx(AssignmentCard, { assignment: assignment, onAction: (action, data) => handleAssignmentAction(assignment.id, action, data), onViewDetails: () => setSelectedAssignment(assignment) }, assignment.id))) }))] }), selectedAssignment && (_jsx(AssignmentActions, { assignment: selectedAssignment, onClose: () => setSelectedAssignment(null), onAction: handleAssignmentAction }))] }) }));
}
