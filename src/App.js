import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { ScrollToTop } from './shared/components/ScrollToTop';
// Context imports - updated paths
import { AdminProvider } from './features/admin/contexts/AdminContext';
import { AuthProvider, useAuth } from './features/auth/contexts/AuthContext';
import { NotificationProvider } from './features/notifications/contexts/NotificationContext';
import { ThemeProvider } from './shared/contexts/ThemeContext';
// Layout components - updated paths
import { Footer } from './shared/components/layout/Footer';
import { Header } from './shared/components/layout/Header';
// Auth components - updated paths
import { ProtectedAdminRoute } from './features/auth/components/ProtectedAdminRoute';
import { ProtectedRoute } from './features/auth/components/ProtectedRoute';
// Dashboard component - new import
import UniversalDashboard from './features/dashboard/components/UniversalDashboard';
// Page imports - updated paths
import { AdminDashboard } from './features/admin/pages/AdminDashboard';
import { AdminLogin } from './features/auth/pages/AdminLogin';
import { Login } from './features/auth/pages/Login';
import { ArticleView } from './features/learning/pages/ArticleView';
import { Learning } from './features/learning/pages/Learning';
import { About } from './features/marketing/pages/About';
import { Achievements } from './features/marketing/pages/Achievements';
import { Contact } from './features/marketing/pages/Contact';
import { Home } from './features/marketing/pages/Home';
import { Services } from './features/marketing/pages/Services';
import { Testimonials } from './features/marketing/pages/Testimonials';
import { BookClass } from './features/scheduling/pages/BookClass';
import { BookCorporate } from './features/scheduling/pages/BookCorporate';
import { BookOneOnOne } from './features/scheduling/pages/BookOneOnOne';
import InstructorProfile from './features/scheduling/pages/InstructorProfile';
import { Schedule } from './features/scheduling/pages/Schedule';
import { Profile } from './features/user-profile/pages/Profile';
import { NotFound } from './pages/NotFound';
function App() {
    return (_jsx(ThemeProvider, { children: _jsxs(Router, { children: [_jsx(ScrollToTop, {}), _jsx(AuthProvider, { children: _jsx(NotificationProvider, { children: _jsx(AdminProvider, { children: _jsx(AppRoutes, {}) }) }) })] }) }));
}
function AppRoutes() {
    const { user, userRoles } = useAuth(); // Get current user from auth context
    // Compose a dashboardUser with a role property for UniversalDashboard
    const dashboardUser = user && userRoles.length > 0
        ? {
            id: user.id,
            email: user.email || '',
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            role: userRoles[0],
            isActive: !!user.email_confirmed_at,
            createdAt: new Date(user.created_at),
            updatedAt: new Date(user.updated_at || user.created_at)
        }
        : null;
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/admin/login", element: _jsx(AdminLogin, {}) }), _jsx(Route, { path: "/admin/dashboard", element: _jsx(ProtectedAdminRoute, { children: _jsx(AdminDashboard, {}) }) }), _jsx(Route, { path: "/dashboard/*", element: _jsx(ProtectedRoute, { children: _jsx("div", { className: "min-h-screen", children: dashboardUser && _jsx(UniversalDashboard, { user: dashboardUser }) }) }) }), _jsx(Route, { path: "/unauthorized", element: _jsxs("div", { className: "min-h-screen flex flex-col", children: [_jsx(Header, {}), _jsx("main", { className: "flex-grow flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("h1", { className: "text-2xl font-bold text-red-600 mb-4", children: "Unauthorized Access" }), _jsx("p", { className: "text-gray-600", children: "You don't have permission to access this resource." })] }) }), _jsx(Footer, {})] }) }), _jsx(Route, { path: "/*", element: _jsxs("div", { className: "min-h-screen flex flex-col", children: [_jsx(Header, {}), _jsx("main", { className: "flex-grow", children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Home, {}) }), _jsx(Route, { path: "/about", element: _jsx(About, {}) }), _jsx(Route, { path: "/services", element: _jsx(Services, {}) }), _jsx(Route, { path: "/schedule", element: _jsx(Schedule, {}) }), _jsx(Route, { path: "/testimonials", element: _jsx(Testimonials, {}) }), _jsx(Route, { path: "/book-class", element: _jsx(BookClass, {}) }), _jsx(Route, { path: "/contact", element: _jsx(Contact, {}) }), _jsx(Route, { path: "/learning", element: _jsx(Learning, {}) }), _jsx(Route, { path: "/learning/:id", element: _jsx(ArticleView, {}) }), _jsx(Route, { path: "/login", element: _jsx(Login, {}) }), _jsx(Route, { path: "/profile", element: _jsx(ProtectedRoute, { children: _jsx(Profile, {}) }) }), _jsx(Route, { path: "/instructor/:instructorId", element: _jsx(InstructorProfile, {}) }), _jsx(Route, { path: "*", element: _jsx(NotFound, {}) }), _jsx(Route, { path: "/book/individual", element: _jsx(BookOneOnOne, {}) }), _jsx(Route, { path: "/book/corporate", element: _jsx(BookCorporate, {}) }), _jsx(Route, { path: "/achievements", element: _jsx(Achievements, {}) })] }) }), _jsx(Footer, {})] }) })] }));
}
export default App;
