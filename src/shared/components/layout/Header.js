import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { BookOpen, ChevronDown, ChevronUp, LayoutDashboard, LogOut, Menu, User, UserCircle, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAdmin as useAdminContext } from '../../../features/admin/contexts/AdminContext';
import { useAuth } from '../../../features/auth/contexts/AuthContext';
import { NotificationDropdown } from '../../../features/notifications/components/NotificationDropdown';
import { Button } from '../ui/Button';
export function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const { user, isMantraCurator: authMantraCurator, signOut } = useAuth();
    const { isAdmin, isMantraCurator: adminMantraCurator } = useAdminContext();
    const location = useLocation();
    const dropdownRef = useRef(null);
    // Combine curator status from both contexts for backward compatibility
    const isMantraCurator = authMantraCurator || adminMantraCurator;
    const navigation = [
        { name: 'Home', href: '/' },
        { name: 'About', href: '/about' },
        { name: 'Services', href: '/services' },
        { name: 'Schedule', href: '/schedule' },
        { name: 'Learning', href: '/learning' },
        { name: 'Testimonials', href: '/testimonials' },
        { name: 'Contact', href: '/contact' },
    ];
    const isActive = (path) => location.pathname === path;
    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    const getUserDisplayName = () => {
        if (user?.user_metadata?.full_name) {
            return user.user_metadata.full_name;
        }
        // If no full name, extract name from email (before @)
        if (user?.email) {
            return user.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        }
        return 'User';
    };
    const handleSignOut = () => {
        signOut();
        setIsDropdownOpen(false);
    };
    return (_jsx("header", { className: "bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [_jsxs("div", { className: "flex justify-between items-center py-4", children: [_jsxs(Link, { to: "/", className: "flex items-center space-x-3", children: [_jsx("div", { className: "w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center", children: _jsx("span", { className: "text-white font-bold text-lg", children: "Y" }) }), _jsx("span", { className: "text-2xl font-bold text-gray-900", children: "Yogodyaan" })] }), _jsx("nav", { className: "hidden md:flex space-x-8", children: navigation.map((item) => (_jsx(Link, { to: item.href, className: `font-medium transition-colors duration-200 ${isActive(item.href)
                                    ? 'text-blue-600 border-b-2 border-blue-600 pb-1'
                                    : 'text-gray-700 hover:text-blue-600'}`, children: item.name }, item.name))) }), _jsx("div", { className: "hidden md:flex items-center space-x-4", children: user ? (_jsxs(_Fragment, { children: [_jsx(NotificationDropdown, {}), _jsxs("div", { className: "relative", ref: dropdownRef, children: [_jsxs("button", { onClick: () => setIsDropdownOpen(!isDropdownOpen), className: "flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-gray-50", children: [_jsx(User, { size: 20 }), _jsx("div", { className: "flex flex-col items-start", children: _jsxs("span", { className: "text-sm font-medium", children: [getUserDisplayName(), isAdmin && _jsx("span", { className: "text-blue-600 ml-1", children: "(Admin)" }), isMantraCurator && !isAdmin && _jsx("span", { className: "text-emerald-600 ml-1", children: "(Curator)" })] }) }), isDropdownOpen ? (_jsx(ChevronUp, { size: 16, className: "text-gray-400" })) : (_jsx(ChevronDown, { size: 16, className: "text-gray-400" }))] }), isDropdownOpen && (_jsxs("div", { className: "absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200", children: [_jsxs(Link, { to: "/profile", onClick: () => setIsDropdownOpen(false), className: "flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors", children: [_jsx(UserCircle, { size: 16, className: "mr-2" }), "Profile"] }), _jsxs(Link, { to: "/dashboard", onClick: () => setIsDropdownOpen(false), className: "flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors", children: [_jsx(LayoutDashboard, { size: 16, className: "mr-2" }), "Dashboard"] }), isMantraCurator && (_jsxs(Link, { to: "/admin/dashboard", onClick: () => setIsDropdownOpen(false), className: "flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors", children: [_jsx(BookOpen, { size: 16, className: "mr-2" }), "Manage Articles"] })), isAdmin && (_jsxs(Link, { to: "/admin/dashboard", onClick: () => setIsDropdownOpen(false), className: "flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors", children: [_jsx(LayoutDashboard, { size: 16, className: "mr-2" }), "Admin Dashboard"] })), _jsx("hr", { className: "my-1" }), _jsxs("button", { onClick: handleSignOut, className: "flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors", children: [_jsx(LogOut, { size: 16, className: "mr-2" }), "Sign Out"] })] }))] })] })) : (_jsx(Link, { to: "/login", children: _jsx(Button, { variant: "outline", size: "sm", children: "Sign In" }) })) }), _jsx("button", { className: "md:hidden", onClick: () => setIsMenuOpen(!isMenuOpen), children: isMenuOpen ? _jsx(X, { size: 24 }) : _jsx(Menu, { size: 24 }) })] }), isMenuOpen && (_jsx("div", { className: "md:hidden py-4 border-t", children: _jsxs("nav", { className: "flex flex-col space-y-4", children: [navigation.map((item) => (_jsx(Link, { to: item.href, className: `font-medium transition-colors duration-200 ${isActive(item.href)
                                    ? 'text-blue-600'
                                    : 'text-gray-700 hover:text-blue-600'}`, onClick: () => setIsMenuOpen(false), children: item.name }, item.name))), _jsx("div", { className: "pt-4 border-t", children: user ? (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between pb-3 border-b border-gray-200", children: [_jsx("span", { className: "text-sm font-medium text-gray-700", children: "Notifications" }), _jsx(NotificationDropdown, {})] }), _jsxs("div", { className: "flex items-center space-x-2 text-gray-700 mb-3", children: [_jsx(User, { size: 20 }), _jsxs("span", { className: "text-sm font-medium", children: [getUserDisplayName(), isAdmin && _jsx("span", { className: "text-blue-600 ml-1", children: "(Admin)" }), isMantraCurator && !isAdmin && _jsx("span", { className: "text-emerald-600 ml-1", children: "(Curator)" })] })] }), _jsxs(Link, { to: "/profile", onClick: () => setIsMenuOpen(false), className: "flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors py-2", children: [_jsx(UserCircle, { size: 16 }), _jsx("span", { children: "Profile" })] }), _jsxs(Link, { to: "/dashboard", onClick: () => setIsMenuOpen(false), className: "flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors py-2", children: [_jsx(LayoutDashboard, { size: 16 }), _jsx("span", { children: "Dashboard" })] }), isMantraCurator && (_jsxs(Link, { to: "/admin/dashboard", onClick: () => setIsMenuOpen(false), className: "flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors py-2", children: [_jsx(BookOpen, { size: 16 }), _jsx("span", { children: "Manage Articles" })] })), isAdmin && (_jsxs(Link, { to: "/admin/dashboard", onClick: () => setIsMenuOpen(false), className: "flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors py-2", children: [_jsx(LayoutDashboard, { size: 16 }), _jsx("span", { children: "Admin Dashboard" })] })), _jsxs(Button, { variant: "outline", size: "sm", onClick: () => {
                                                signOut();
                                                setIsMenuOpen(false);
                                            }, className: "flex items-center space-x-1 w-full justify-center", children: [_jsx(LogOut, { size: 16 }), _jsx("span", { children: "Sign Out" })] })] })) : (_jsx(Link, { to: "/login", onClick: () => setIsMenuOpen(false), children: _jsx(Button, { variant: "outline", size: "sm", className: "w-full", children: "Sign In" }) })) })] }) }))] }) }));
}
