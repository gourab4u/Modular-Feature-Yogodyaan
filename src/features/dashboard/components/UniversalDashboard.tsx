// src/features/dashboard/components/UniversalDashboard.tsx

import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { User } from '../../../shared/types/user';
import { getModulesForRole, hasModuleAccess } from '../../../shared/config/roleConfig';
import RoleBasedNavigation from '../../../shared/components/navigation/RoleBasedNavigation';

// Lazy load components
const Overview = React.lazy(() => import('./modules/Overview'));
const UserManagement = React.lazy(() => import('./modules/UserManagement'));
const InstructorManagement = React.lazy(() => import('./modules/InstructorManagement'));
const Transactions = React.lazy(() => import('./modules/Transactions'));
const BusinessSettings = React.lazy(() => import('./modules/BusinessSettings'));
const ArticleEditing = React.lazy(() => import('./modules/ArticleEditing'));
const UserProfile = React.lazy(() => import('./modules/UserProfile'));
const Bookings = React.lazy(() => import('./modules/Bookings'));
const AssignedBookings = React.lazy(() => import('./modules/AssignedBookings'));
const WeeklySchedule = React.lazy(() => import('./modules/WeeklySchedule'));
const FinancialData = React.lazy(() => import('./modules/FinancialData'));
const Forms = React.lazy(() => import('./modules/Forms'));
const CommentModeration = React.lazy(() => import('./modules/CommentModeration'));

interface UniversalDashboardProps {
  user: User;
}

const UniversalDashboard: React.FC<UniversalDashboardProps> = ({ user }) => {
  const userModules = getModulesForRole(user.role);
  
  // Component mapping
  const componentMap: Record<string, React.ComponentType> = {
    Overview,
    UserManagement,
    InstructorManagement,
    Transactions,
    BusinessSettings,
    ArticleEditing,
    UserProfile,
    Bookings,
    AssignedBookings,
    WeeklySchedule,
    FinancialData,
    Forms,
    CommentModeration
  };

  // Get the first available module for redirect
  const defaultModule = userModules[0]?.id || 'user_profile';

  // Protected Route Component
  const ProtectedModuleRoute: React.FC<{ 
    moduleId: string; 
    component: React.ComponentType; 
  }> = ({ moduleId, component: Component }) => {
    if (!hasModuleAccess(user.role, moduleId as any)) {
      return <Navigate to="/unauthorized" replace />;
    }
    
    return <Component />;
  };

  return (
    <div className="universal-dashboard">
      <div className="dashboard-sidebar">
        <RoleBasedNavigation user={user} />
      </div>
      
      <div className="dashboard-content">
        <Suspense fallback={<div className="loading">Loading...</div>}>
          <Routes>
            {/* Default redirect to first available module */}
            <Route path="/" element={<Navigate to={defaultModule} replace />} />
            
            {/* Dynamic routes based on user role */}
            {userModules.map(module => {
              const Component = componentMap[module.component];
              if (!Component) {
                console.warn(`Component ${module.component} not found`);
                return null;
              }
              
              return (
                <Route 
                  key={module.id}
                  path={`/${module.id}`} 
                  element={
                    <ProtectedModuleRoute 
                      moduleId={module.id} 
                      component={Component} 
                    />
                  } 
                />
              );
            })}
            
            {/* Fallback for unauthorized access */}
            <Route path="*" element={<Navigate to={defaultModule} replace />} />
          </Routes>
        </Suspense>
      </div>
    </div>
  );
};

export default UniversalDashboard;