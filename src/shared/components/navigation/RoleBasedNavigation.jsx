// RoleBasedNavigation.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getModulesByRole, getDashboardLabel } from './roleConfig';

const RoleBasedNavigation = ({ user }) => {
  const location = useLocation();
  const userModules = getModulesByRole(user.role);
  const dashboardLabel = getDashboardLabel(user.role);

  return (
    <nav className="dashboard-navigation">
      <div className="nav-header">
        <h2>{dashboardLabel}</h2>
        <div className="user-info">
          <span>{user.name}</span>
          <span className="role-badge">{user.role}</span>
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