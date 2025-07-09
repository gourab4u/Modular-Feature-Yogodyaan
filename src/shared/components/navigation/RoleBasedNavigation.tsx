// shared/components/navigation/RoleBasedNavigation.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getModulesByRole, getDashboardLabel, ModuleWithConfig } from '../../config/roleConfig';
import { User } from '../../types/user';

interface RoleBasedNavigationProps {
  user: User;
  className?: string;
}

const RoleBasedNavigation: React.FC<RoleBasedNavigationProps> = ({ user, className = '' }) => {
  const location = useLocation();
  const userModules: ModuleWithConfig[] = getModulesByRole(user.role);
  const dashboardLabel: string = getDashboardLabel(user.role);

  return (
    <nav className={`dashboard-navigation ${className}`}>
      <div className="nav-header">
        <h2>{dashboardLabel}</h2>
        <div className="user-info">
          <span>{user.name}</span>
          <span className="role-badge">{user.role.replace('_', ' ')}</span>
        </div>
      </div>
      
      <ul className="nav-menu">
        {userModules.map((module) => (
          <li key={module.key} className="nav-item">
            <Link 
              to={module.path}
              className={`nav-link ${location.pathname === module.path ? 'active' : ''}`}
            >
              <span className="nav-icon">{module.icon}</span>
              <span className="nav-text">{module.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default RoleBasedNavigation;