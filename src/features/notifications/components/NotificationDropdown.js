import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2, X } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
export function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    const getNotificationIcon = (type) => {
        switch (type) {
            case 'article_approved':
                return '✅';
            case 'article_rejected':
                return '❌';
            case 'class_booked':
                return '📅';
            case 'class_cancelled':
                return '🚫';
            case 'class_reminder':
                return '⏰';
            default:
                return '📢';
        }
    };
    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
        if (diffInHours < 1) {
            const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
            return diffInMinutes < 1 ? 'Just now' : `${diffInMinutes}m ago`;
        }
        else if (diffInHours < 24) {
            return `${diffInHours}h ago`;
        }
        else {
            const diffInDays = Math.floor(diffInHours / 24);
            return `${diffInDays}d ago`;
        }
    };
    return (_jsxs("div", { className: "relative", ref: dropdownRef, children: [_jsxs("button", { onClick: () => setIsOpen(!isOpen), className: "relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:text-gray-900", children: [_jsx(Bell, { className: "w-6 h-6" }), unreadCount > 0 && (_jsx("span", { className: "absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center", children: unreadCount > 99 ? '99+' : unreadCount }))] }), isOpen && (_jsxs("div", { className: "absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden", children: [_jsx("div", { className: "p-4 border-b border-gray-200", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "Notifications" }), _jsxs("div", { className: "flex items-center space-x-2", children: [unreadCount > 0 && (_jsxs("button", { onClick: markAllAsRead, className: "text-sm text-blue-600 hover:text-blue-800 flex items-center", children: [_jsx(CheckCheck, { className: "w-4 h-4 mr-1" }), "Mark all read"] })), _jsx("button", { onClick: () => setIsOpen(false), className: "text-gray-400 hover:text-gray-600", children: _jsx(X, { className: "w-4 h-4" }) })] })] }) }), _jsx("div", { className: "overflow-y-auto max-h-80", children: loading ? (_jsx("div", { className: "p-4 text-center text-gray-500", children: "Loading..." })) : notifications.length === 0 ? (_jsxs("div", { className: "p-8 text-center text-gray-500", children: [_jsx(Bell, { className: "w-12 h-12 mx-auto mb-2 text-gray-300" }), _jsx("p", { children: "No notifications yet" })] })) : (_jsx("div", { className: "divide-y divide-gray-100", children: notifications.map((notification) => (_jsx("div", { className: `p-4 hover:bg-gray-50 ${!notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`, children: _jsxs("div", { className: "flex items-start space-x-3", children: [_jsx("span", { className: "text-2xl flex-shrink-0", children: getNotificationIcon(notification.type) }), _jsx("div", { className: "flex-1 min-w-0", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsx("p", { className: `text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`, children: notification.title }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: notification.message }), _jsx("p", { className: "text-xs text-gray-400 mt-2", children: formatTime(notification.created_at) })] }), _jsxs("div", { className: "flex items-center space-x-1 ml-2", children: [!notification.read && (_jsx("button", { onClick: (e) => {
                                                                    e.stopPropagation();
                                                                    markAsRead(notification.id);
                                                                }, className: "text-blue-600 hover:text-blue-800 p-1", title: "Mark as read", children: _jsx(Check, { className: "w-3 h-3" }) })), _jsx("button", { onClick: (e) => {
                                                                    e.stopPropagation();
                                                                    deleteNotification(notification.id);
                                                                }, className: "text-red-600 hover:text-red-800 p-1", title: "Delete", children: _jsx(Trash2, { className: "w-3 h-3" }) })] })] }) })] }) }, notification.id))) })) }), notifications.length > 0 && (_jsx("div", { className: "p-3 border-t border-gray-200 bg-gray-50", children: _jsx("button", { className: "w-full text-sm text-blue-600 hover:text-blue-800 font-medium", onClick: () => {
                                setIsOpen(false);
                                // You can navigate to a full notifications page here if needed
                            }, children: "View all notifications" }) }))] }))] }));
}
