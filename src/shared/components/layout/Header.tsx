import { BookOpen, ChevronDown, ChevronUp, LayoutDashboard, LogOut, Menu, User, UserCircle, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAdmin as useAdminContext } from '../../../features/admin/contexts/AdminContext';
import { useAuth } from '../../../features/auth/contexts/AuthContext';
import { NotificationDropdown } from '../../../features/notifications/components/NotificationDropdown';
import { Button } from '../ui/Button';
import { ThemeToggle } from '../ui/ThemeToggle';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { user, isMantraCurator: authMantraCurator, signOut } = useAuth();
  const { isAdmin, isMantraCurator: adminMantraCurator } = useAdminContext();
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Combine curator status from both contexts for backward compatibility
  const isMantraCurator = authMantraCurator || adminMantraCurator;

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Services', href: '/services' },
    { name: 'Schedule', href: '/schedule' },
    { name: 'Learning', href: '/learning' },
    { name: 'Contact', href: '/contact' },
  ];

  const isActive = (path: string) => location.pathname === path;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  const handleSignOut = () => {
    signOut();
    setIsDropdownOpen(false);
  };

  return (
    <header className="bg-white dark:bg-slate-900 shadow-sm sticky top-0 z-50 border-b border-gray-100 dark:border-slate-700 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">Y</span>
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-slate-100">Yogodyaan</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`font-medium transition-colors duration-200 ${isActive(item.href)
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 pb-1'
                  : 'text-gray-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Theme Toggle */}
            <ThemeToggle />
            
            {user ? (
              <>
                {/* 🔔 Notification Bell - Enhanced styling */}
                <div className="relative">
                  <div className="p-2 rounded-full bg-blue-50 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700 transition-colors duration-200 border border-blue-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-slate-500 shadow-sm">
                    <NotificationDropdown />
                  </div>
                </div>

                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center text-gray-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 p-2.5 rounded-full hover:bg-blue-50 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-slate-500 bg-white dark:bg-slate-900 hover:shadow-sm"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                      <User size={18} className="text-white" />
                    </div>
                    {/* Removed full name and roles */}
                    {isDropdownOpen ? (
                      <ChevronUp size={16} className="text-gray-400 ml-2" />
                    ) : (
                      <ChevronDown size={16} className="text-gray-400 ml-2" />
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-slate-600 backdrop-blur-sm">
                      <Link
                        to="/profile"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        <UserCircle size={16} className="mr-2" />
                        Profile
                      </Link>

                      <Link
                        to="/dashboard"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        <LayoutDashboard size={16} className="mr-2" />
                        Dashboard
                      </Link>

                      {isMantraCurator && (
                        <Link
                          to="/admin/dashboard"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors"
                        >
                          <BookOpen size={16} className="mr-2" />
                          Manage Articles
                        </Link>
                      )}

                      {isAdmin && (
                        <Link
                          to="/admin/dashboard"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors"
                        >
                          <LayoutDashboard size={16} className="mr-2" />
                          Admin Dashboard
                        </Link>
                      )}

                      <hr className="my-1" />

                      <button
                        onClick={handleSignOut}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        <LogOut size={16} className="mr-2" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link to="/login">
                <Button variant="outline" size="sm">Sign In</Button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-gray-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            <nav className="flex flex-col space-y-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`font-medium transition-colors duration-200 ${isActive(item.href)
                    ? 'text-blue-600'
                    : 'text-gray-700 dark:text-gray-200 hover:text-blue-600'
                    }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="pt-4 border-t">
                {/* Theme Toggle for Mobile */}
                <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700 mb-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Theme</span>
                  <ThemeToggle />
                </div>
                
                {user ? (
                  <div className="space-y-3">
                    {/* 🔔 Mobile Notification Section - Enhanced */}
                    <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Notifications</span>
                      <div className="p-2 rounded-full bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 border border-gray-200 dark:border-gray-700">
                        <NotificationDropdown />
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 text-gray-700 dark:text-gray-200 mb-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <User size={18} className="text-white" />
                      </div>
                      <span className="text-sm font-medium">Account</span>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center space-x-2 text-gray-700 dark:text-gray-200 hover:text-blue-600 transition-colors py-2"
                    >
                      <UserCircle size={16} />
                      <span>Profile</span>
                    </Link>

                    <Link
                      to="/dashboard"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center space-x-2 text-gray-700 dark:text-gray-200 hover:text-blue-600 transition-colors py-2"
                    >
                      <LayoutDashboard size={16} />
                      <span>Dashboard</span>
                    </Link>

                    {isMantraCurator && (
                      <Link
                        to="/admin/dashboard"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center space-x-2 text-gray-700 dark:text-gray-200 hover:text-blue-600 transition-colors py-2"
                      >
                        <BookOpen size={16} />
                        <span>Manage Articles</span>
                      </Link>
                    )}

                    {isAdmin && (
                      <Link
                        to="/admin/dashboard"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center space-x-2 text-gray-700 dark:text-gray-200 hover:text-blue-600 transition-colors py-2"
                      >
                        <LayoutDashboard size={16} />
                        <span>Admin Dashboard</span>
                      </Link>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        signOut();
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center space-x-1 w-full justify-center"
                    >
                      <LogOut size={16} />
                      <span>Sign Out</span>
                    </Button>
                  </div>
                ) : (
                  <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full">Sign In</Button>
                  </Link>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}