import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Calendar, Clock, DollarSign, Filter, Search, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../../../shared/components/ui/Button';
import { LoadingSpinner } from '../../../shared/components/ui/LoadingSpinner';
import { supabase } from '../../../shared/lib/supabase';
import { useAuth } from '../../auth/contexts/AuthContext';
import { ClassAssignmentManager } from './ClassAssignmentManager';
export function YogaAcharyaDashboard() {
    const { user, userRoles } = useAuth();
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [timeFilter, setTimeFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('my-classes');
    // Check if user can assign classes (yoga acharya with permission)
    const canAssignClasses = userRoles.includes('yoga_acharya') || userRoles.includes('admin');
    useEffect(() => {
        if (user) {
            fetchAssignments();
        }
    }, [user]);
    const fetchAssignments = async () => {
        if (!user)
            return;
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('class_assignments')
                .select(`
          *,
          scheduled_class:scheduled_classes(
            id,
            start_time,
            end_time,
            status,
            class_type:class_types(name, difficulty_level),
            instructor:profiles(full_name)
          )
        `)
                .eq('instructor_id', user.id)
                .order('assigned_at', { ascending: false });
            if (error)
                throw error;
            setAssignments(data || []);
        }
        catch (error) {
            console.error('Error fetching assignments:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const getFilteredAssignments = () => {
        const now = new Date();
        return assignments.filter(assignment => {
            const classTime = new Date(assignment.scheduled_class.start_time);
            // Status filter
            const matchesStatus = statusFilter === 'all' || assignment.payment_status === statusFilter;
            // Time filter
            let matchesTime = true;
            if (timeFilter === 'upcoming') {
                matchesTime = classTime > now;
            }
            else if (timeFilter === 'completed') {
                matchesTime = classTime < now || assignment.scheduled_class.status === 'completed';
            }
            // Search filter
            const matchesSearch = searchTerm === '' ||
                assignment.scheduled_class.class_type.name.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesStatus && matchesTime && matchesSearch;
        });
    };
    const getStats = () => {
        const now = new Date();
        const upcoming = assignments.filter(a => new Date(a.scheduled_class.start_time) > now);
        const completed = assignments.filter(a => new Date(a.scheduled_class.start_time) < now);
        const unpaid = assignments.filter(a => a.payment_status === 'pending');
        const totalEarnings = assignments
            .filter(a => a.payment_status === 'paid')
            .reduce((sum, a) => sum + a.payment_amount, 0);
        return { upcoming: upcoming.length, completed: completed.length, unpaid: unpaid.length, totalEarnings };
    };
    const formatDateTime = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    const getStatusColor = (status) => {
        switch (status) {
            case 'paid': return 'bg-green-100 text-green-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    const isUpcoming = (dateString) => {
        return new Date(dateString) > new Date();
    };
    if (loading) {
        return (_jsx("div", { className: "flex justify-center py-12", children: _jsx(LoadingSpinner, { size: "lg" }) }));
    }
    const stats = getStats();
    const filteredAssignments = getFilteredAssignments();
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900 mb-2", children: "Yoga Acharya Dashboard" }), _jsx("p", { className: "text-gray-600", children: "Manage your classes and assignments" })] }), canAssignClasses && (_jsxs("div", { className: "flex space-x-2", children: [_jsx(Button, { onClick: () => setActiveTab('my-classes'), variant: activeTab === 'my-classes' ? 'primary' : 'outline', size: "sm", children: "My Classes" }), _jsxs(Button, { onClick: () => setActiveTab('assign-classes'), variant: activeTab === 'assign-classes' ? 'primary' : 'outline', size: "sm", className: "flex items-center", children: [_jsx(Users, { className: "w-4 h-4 mr-1" }), "Assign Classes"] })] }))] }), activeTab === 'assign-classes' && canAssignClasses ? (_jsx(ClassAssignmentManager, {})) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6", children: [_jsx("div", { className: "bg-white rounded-xl shadow-lg p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Upcoming Classes" }), _jsx("p", { className: "text-3xl font-bold text-blue-600", children: stats.upcoming })] }), _jsx(Calendar, { className: "w-8 h-8 text-blue-600" })] }) }), _jsx("div", { className: "bg-white rounded-xl shadow-lg p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Completed Classes" }), _jsx("p", { className: "text-3xl font-bold text-green-600", children: stats.completed })] }), _jsx(Clock, { className: "w-8 h-8 text-green-600" })] }) }), _jsx("div", { className: "bg-white rounded-xl shadow-lg p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Unpaid Classes" }), _jsx("p", { className: "text-3xl font-bold text-yellow-600", children: stats.unpaid })] }), _jsx(DollarSign, { className: "w-8 h-8 text-yellow-600" })] }) }), _jsx("div", { className: "bg-white rounded-xl shadow-lg p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Total Earnings" }), _jsxs("p", { className: "text-3xl font-bold text-emerald-600", children: ["$", stats.totalEarnings] })] }), _jsx(DollarSign, { className: "w-8 h-8 text-emerald-600" })] }) })] }), _jsx("div", { className: "bg-white rounded-xl shadow-lg p-6", children: _jsxs("div", { className: "flex flex-col md:flex-row gap-4", children: [_jsx("div", { className: "flex-1", children: _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" }), _jsx("input", { type: "text", placeholder: "Search classes...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" })] }) }), _jsx("div", { children: _jsxs("div", { className: "relative", children: [_jsx(Filter, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" }), _jsxs("select", { value: timeFilter, onChange: (e) => setTimeFilter(e.target.value), className: "pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white", children: [_jsx("option", { value: "all", children: "All Classes" }), _jsx("option", { value: "upcoming", children: "Upcoming" }), _jsx("option", { value: "completed", children: "Completed" })] })] }) }), _jsx("div", { children: _jsxs("select", { value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), className: "px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white", children: [_jsx("option", { value: "all", children: "All Status" }), _jsx("option", { value: "pending", children: "Unpaid" }), _jsx("option", { value: "paid", children: "Paid" }), _jsx("option", { value: "cancelled", children: "Cancelled" })] }) })] }) }), _jsx("div", { className: "bg-white rounded-xl shadow-lg overflow-hidden", children: filteredAssignments.length === 0 ? (_jsxs("div", { className: "text-center py-12", children: [_jsx(Calendar, { className: "w-16 h-16 text-gray-400 mx-auto mb-4" }), _jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-2", children: "No assignments found" }), _jsx("p", { className: "text-gray-600", children: assignments.length === 0
                                        ? "You don't have any class assignments yet."
                                        : "No assignments match your current filters." })] })) : (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Class Details" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Schedule" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Payment" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Status" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Notes" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: filteredAssignments.map((assignment) => (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-6 py-4", children: _jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium text-gray-900", children: assignment.scheduled_class.class_type.name }), _jsxs("div", { className: "text-sm text-gray-500 capitalize", children: [assignment.scheduled_class.class_type.difficulty_level, " Level"] })] }) }), _jsx("td", { className: "px-6 py-4", children: _jsxs("div", { children: [_jsxs("div", { className: "text-sm text-gray-900 flex items-center", children: [_jsx(Calendar, { className: "w-4 h-4 mr-1" }), formatDateTime(assignment.scheduled_class.start_time)] }), _jsx("div", { className: `text-xs ${isUpcoming(assignment.scheduled_class.start_time) ? 'text-blue-600' : 'text-gray-500'}`, children: isUpcoming(assignment.scheduled_class.start_time) ? 'Upcoming' : 'Completed' })] }) }), _jsx("td", { className: "px-6 py-4", children: _jsxs("div", { className: "flex items-center", children: [_jsx(DollarSign, { className: "w-4 h-4 text-green-600 mr-1" }), _jsxs("span", { className: "text-sm font-medium text-gray-900", children: ["$", assignment.payment_amount] })] }) }), _jsx("td", { className: "px-6 py-4", children: _jsx("span", { className: `px-2 py-1 text-xs rounded-full ${getStatusColor(assignment.payment_status)}`, children: assignment.payment_status }) }), _jsx("td", { className: "px-6 py-4", children: _jsx("div", { className: "text-sm text-gray-500 max-w-xs truncate", children: assignment.notes || 'No notes' }) })] }, assignment.id))) })] }) })) })] }))] }));
}
