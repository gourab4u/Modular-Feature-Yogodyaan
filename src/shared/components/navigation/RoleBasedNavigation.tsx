// src/shared/components/navigation/RoleBasedNavigation.tsx

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User } from '../../types/user';
import { getModulesForRole, ModuleConfig } from '../../config/roleConfig';

interface RoleBasedNavigationProps {
  user: User;
  className?: string;
}

const RoleBasedNavigation: React.FC<RoleBasedNavigationProps> = ({ user, className = '' }) => {
  const location = useLocation();
  const modules = getModulesForRole(user.role);

  const isActive = (moduleId: string): boolean => {
    const currentPath = location.pathname;
    return currentPath.includes(`/dashboard/${moduleId}`);
  };

  const getIconElement = (iconName?: string) => {
    // You can replace this with your preferred icon library
    // For now, using simple text representation
    const iconMap: Record<string, string> = {
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

  return (
    <nav className={`role-based-navigation ${className}`}>
      <div className="navigation-header">
        <h3>Dashboard</h3>
        <span className="user-role">{user.role.replace('_', ' ').toUpperCase()}</span>
      </div>
      
      <ul className="navigation-list">
        {modules.map((module: ModuleConfig) => (
          <li key={module.id} className="navigation-item">
            <Link
              to={`/dashboard/${module.id}`}
              className={`navigation-link ${isActive(module.id) ? 'active' : ''}`}
            >
              <span className="navigation-icon">
                {getIconElement(module.icon)}
              </span>
              <span className="navigation-title">{module.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default RoleBasedNavigation;