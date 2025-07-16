import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { BarChart3, BookOpen, Calendar, CreditCard, FileText, GraduationCap, LogOut, Mail, MessageCircle, Settings, TrendingUp, Users as UsersIcon, Award, UserCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../shared/components/ui/Button';
import { LoadingSpinner } from '../../../shared/components/ui/LoadingSpinner';
import { supabase } from '../../../shared/lib/supabase';
import { DashboardMetrics } from '../../analytics/components/DashboardMetrics';
import { UserEngagementChart } from '../../analytics/components/UserEngagementChart';
import { useAuth } from '../../auth/contexts/AuthContext';
import { useUserProfiles } from '../../user-profile/hooks/useUserProfiles';
import { ArticleManagement } from '../components/ArticleManagement';
import { BookingManagement } from '../components/BookingManagement';
import { BusinessSettings } from '../components/BusinessSettings';
import { ClassAssignmentManager } from '../components/ClassAssignmentManager';
import { ClassTypeManager } from '../components/ClassTypeManager';
import { FormSubmissions } from '../components/FormSubmissions';
import { InstructorDashboard } from '../components/InstructorDashboard';
import { InstructorManagement } from '../components/InstructorManagement';
import { NewsletterManagement } from '../components/NewsletterManagement';
import { UserManagement } from '../components/UserManagement';
import { WeeklyClassScheduler } from '../components/WeeklyClassScheduler';
import { YogaAcharyaDashboard } from '../components/YogaAcharyaDashboard';
import { useAdmin } from '../contexts/AdminContext';
import TransactionManagement from '../components/TransactionManagement';
export function AdminDashboard() {
    const { admin, isAdmin, signOutAdmin } = useAdmin();
    const { isMantraCurator, user, userRoles } = useAuth();
    const { profiles } = useUserProfiles();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(() => {
        if (userRoles.includes('instructor'))
            return 'instructor-dashboard';
        if (userRoles.includes('yoga_acharya'))
            return 'yoga-acharya-dashboard';
        if (isMantraCurator)
            return 'articles';
        return 'overview';
    });
    useEffect(() => {
        if (!isAdmin && !userRoles.includes('instructor') && !userRoles.includes('yoga_acharya') && !isMantraCurator) {
            navigate('/admin/login');
            return;
        }
        if (isAdmin)
            fetchDashboardData();
        else
            setLoading(false);
    }, [isAdmin, userRoles, isMantraCurator, navigate]);
    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [bookingsRes, queriesRes, contactsRes, articlesRes, viewsRes, classTypesRes, subscriptionsRes, transactionsRes] = await Promise.allSettled([
                supabase.from('bookings').select('*').order('created_at', { ascending: false }),
                supabase.from('yoga_queries').select('*').order('created_at', { ascending: false }),
                supabase.from('contact_messages').select('*').order('created_at', { ascending: false }),
                supabase.from('articles').select('*').order('created_at', { ascending: false }),
                supabase.from('article_views').select('*'),
                supabase.from('class_types').select('*').order('created_at', { ascending: false }),
                supabase.from('user_subscriptions').select('*, subscription_plans(*)').order('created_at', { ascending: false }),
                supabase.from('transactions').select('*').order('created_at', { ascending: false })
            ]);
            const safeData = (res) => (res.status === 'fulfilled' && !res.value.error ? res.value.data || [] : []);
            const bookings = safeData(bookingsRes);
            const queries = safeData(queriesRes);
            const contacts = safeData(contactsRes);
            const articles = safeData(articlesRes);
            const views = safeData(viewsRes);
            const classTypes = safeData(classTypesRes);
            const subscriptions = safeData(subscriptionsRes);
            const transactions = safeData(transactionsRes);
            // ✅ NEW: Filter instructors from profiles by role
            const instructors = profiles.filter(profile => profile.user_roles?.some((r) => ['instructor', 'yoga_acharya'].includes(r.roles?.name)));
            const monthlyRevenue = transactions
                .filter(t => t?.status === 'completed' && new Date(t.created_at) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1))
                .reduce((sum, t) => sum + parseFloat(t?.amount || '0'), 0);
            setStats({
                totalBookings: bookings.length,
                totalQueries: queries.length,
                totalContacts: contacts.length,
                totalArticles: articles.length,
                publishedArticles: articles.filter(a => a?.status === 'published').length,
                totalViews: views.length,
                totalUsers: profiles.length,
                activeSubscriptions: subscriptions.filter(s => s?.status === 'active').length,
                monthlyRevenue,
                recentBookings: bookings.slice(0, 5),
                pendingQueries: queries.filter(q => q?.status === 'pending').slice(0, 10),
                newContacts: contacts.filter(c => c?.status === 'new').slice(0, 10),
                allBookings: bookings,
                allQueries: queries,
                allContacts: contacts,
                allInstructors: instructors,
                allClassTypes: classTypes,
                allSubscriptions: subscriptions,
                allTransactions: transactions
            });
        }
        catch (err) {
            console.error('Dashboard error:', err);
            setStats(null);
        }
        finally {
            setLoading(false);
        }
    };
    const handleSignOut = async () => {
        await signOutAdmin();
        navigate('/');
    };
    if (loading)
        return _jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50", children: _jsx(LoadingSpinner, {}) });
    if (!isAdmin) {
        if (userRoles.includes('instructor')) {
            return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx(Header, { title: "Instructor Dashboard", email: user?.email, onSignOut: handleSignOut }), _jsx("main", { className: "max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8", children: _jsx(InstructorDashboard, {}) })] }));
        }
        if (userRoles.includes('yoga_acharya')) {
            return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx(Header, { title: "Yoga Acharya Dashboard", email: user?.email, onSignOut: handleSignOut }), _jsx("main", { className: "max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8", children: _jsx(YogaAcharyaDashboard, {}) })] }));
        }
        if (isMantraCurator) {
            return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx(Header, { title: "Article Management", email: user?.email, onSignOut: handleSignOut }), _jsx("main", { className: "max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8", children: _jsx(ArticleManagement, { authorId: user?.id }) })] }));
        }
    }
    if (!stats) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50", children: _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-gray-600", children: "Failed to load dashboard." }), _jsx(Button, { onClick: fetchDashboardData, className: "mt-4", children: "Retry" })] }) }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx(Header, { title: "Admin Dashboard", email: admin?.email, onSignOut: handleSignOut }), _jsx("nav", { className: "bg-white border-b px-4 sm:px-6 lg:px-8", children: _jsx("div", { className: "flex space-x-6 overflow-x-auto", children: [
                        { id: 'overview', label: 'Overview', icon: _jsx(BarChart3, { className: "w-4 h-4" }) },
                        { id: 'users', label: 'Users', icon: _jsx(UsersIcon, { className: "w-4 h-4" }) },
                        { id: 'instructors', label: 'Instructors', icon: _jsx(GraduationCap, { className: "w-4 h-4" }) },
                        { id: 'classes', label: 'Class Types', icon: _jsx(Award, { className: "w-4 h-4" }) },
                        { id: 'schedule', label: 'Weekly Schedule', icon: _jsx(Calendar, { className: "w-4 h-4" }) },
                        { id: 'assignments', label: 'Assignments', icon: _jsx(UserCheck, { className: "w-4 h-4" }) },
                        { id: 'bookings', label: 'Bookings', icon: _jsx(Calendar, { className: "w-4 h-4" }) },
                        { id: 'articles', label: 'Articles', icon: _jsx(BookOpen, { className: "w-4 h-4" }) },
                        { id: 'subscriptions', label: 'Subscriptions', icon: _jsx(CreditCard, { className: "w-4 h-4" }) },
                        { id: 'transactions', label: 'Transactions', icon: _jsx(TrendingUp, { className: "w-4 h-4" }) },
                        { id: 'queries', label: 'Yoga Queries', icon: _jsx(MessageCircle, { className: "w-4 h-4" }) },
                        { id: 'contacts', label: 'Contact Messages', icon: _jsx(Mail, { className: "w-4 h-4" }) },
                        { id: 'submissions', label: 'Forms', icon: _jsx(FileText, { className: "w-4 h-4" }) },
                        { id: 'newsletter', label: 'Newsletter', icon: _jsx(Mail, { className: "w-4 h-4" }) },
                        { id: 'settings', label: 'Settings', icon: _jsx(Settings, { className: "w-4 h-4" }) }
                    ].map(tab => (_jsxs("button", { onClick: () => setActiveTab(tab.id), className: `py-4 text-sm font-medium flex items-center space-x-1 border-b-2 ${activeTab === tab.id
                            ? 'border-emerald-600 text-emerald-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'}`, children: [tab.icon, _jsx("span", { children: tab.label })] }, tab.id))) }) }), _jsxs("main", { className: "max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8", children: [activeTab === 'overview' && (_jsxs(_Fragment, { children: [_jsx(DashboardMetrics, {}), _jsx("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8", children: _jsx(UserEngagementChart, {}) })] })), activeTab === 'users' && _jsx(UserManagement, {}), activeTab === 'instructors' && _jsx(InstructorManagement, {}), activeTab === 'classes' && _jsx(ClassTypeManager, {}), activeTab === 'schedule' && _jsx(WeeklyClassScheduler, {}), activeTab === 'assignments' && _jsx(ClassAssignmentManager, {}), activeTab === 'bookings' && _jsx(BookingManagement, {}), activeTab === 'articles' && _jsx(ArticleManagement, {}), activeTab === 'subscriptions' && _jsx(BusinessSettings, {}), activeTab === 'transactions' && _jsx(TransactionManagement, {}), activeTab === 'queries' && _jsx(BusinessSettings, {}), activeTab === 'contacts' && _jsx(BusinessSettings, {}), activeTab === 'submissions' && _jsx(FormSubmissions, {}), activeTab === 'newsletter' && _jsx(NewsletterManagement, {}), activeTab === 'settings' && _jsx(BusinessSettings, {})] })] }));
}
function Header({ title, email, onSignOut }) {
    const navigate = useNavigate();
    return (_jsx("header", { className: "bg-white shadow-sm border-b", children: _jsxs("div", { className: "max-w-7xl mx-auto flex justify-between items-center py-4 px-4 sm:px-6 lg:px-8", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("div", { className: "w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold", children: "Y" }), _jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: title }), _jsxs("p", { className: "text-sm text-gray-600", children: ["Welcome back, ", email] })] })] }), _jsxs("div", { className: "flex space-x-4", children: [_jsx(Button, { variant: "outline", onClick: () => navigate('/'), children: "View Site" }), _jsxs(Button, { variant: "outline", onClick: onSignOut, children: [_jsx(LogOut, { className: "w-4 h-4 mr-2" }), "Sign Out"] })] })] }) }));
}
