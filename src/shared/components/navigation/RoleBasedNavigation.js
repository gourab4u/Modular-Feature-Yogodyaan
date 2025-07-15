import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, useLocation } from 'react-router-dom';
import { getModulesForRole } from '../../config/roleConfig';
const RoleBasedNavigation = ({ user, className = '' }) => {
    const location = useLocation();
    const modules = getModulesForRole(user.role);
    const isActive = (moduleId) => {
        const currentPath = location.pathname;
        return currentPath.includes(`/dashboard/${moduleId}`);
    };
    const getIconElement = (iconName) => {
        // You can replace this with your preferred icon library
        // For now, using simple text representation
        const iconMap = {
            dashboard: '📊',
            users: '👥',
            teacher: '🧑‍🏫',
            'credit-card': '💳',
            settings: '⚙️',
            edit: '✏️',
            user: '👤',
            calendar: '📅',
            schedule: '🗓️',
            'bar-chart': '📈',
            'file-text': '📄',
            'message-square': '💬'
        };
        return iconMap[iconName || 'dashboard'] || '📋';
    };
    return (_jsxs("nav", { className: `role-based-navigation ${className}`, children: [_jsxs("div", { className: "navigation-header", children: [_jsx("h3", { children: "Dashboard" }), _jsx("span", { className: "user-role", children: user.role.replace('_', ' ').toUpperCase() })] }), _jsx("ul", { className: "navigation-list", children: modules.map((module) => (_jsx("li", { className: "navigation-item", children: _jsxs(Link, { to: `/dashboard/${module.id}`, className: `navigation-link ${isActive(module.id) ? 'active' : ''}`, children: [_jsx("span", { className: "navigation-icon", children: getIconElement(module.icon) }), _jsx("span", { className: "navigation-title", children: module.title })] }) }, module.id))) })] }));
};
export default RoleBasedNavigation;
