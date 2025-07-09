// features/dashboard/components/UniversalDashboard.tsx
import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { hasModuleAccess, getUserModules, ModuleKey } from '../../../shared/config/roleConfig';
import { User } from '../../../shared/types/user';
import RoleBasedNavigation from '../../../shared/components/navigation/RoleBasedNavigation';

// Import your existing components
import Overview from './modules/Overview';
import UserManagement from './modules/UserManagement';
import InstructorManagement from './modules/InstructorManagement';
import Transactions from './modules/Transactions';
import BusinessSettings from './modules/BusinessSettings';
import UserProfile from './modules/UserProfile';

// Import new components (create these as needed)
import ArticleEditor from './modules/ArticleEditor';
import AssignedBookings from './modules/AssignedBookings';
import BookingManagement from './modules/BookingManagement';
import UserData from './modules/UserData';
import WeeklySchedule from './modules/WeeklySchedule';
import FinancialData from './modules/FinancialData';
import CommentModeration from './modules/CommentModeration';
import ArticleReview from './modules/ArticleReview';
import Forms from './modules/Forms';

interface UniversalDashboardProps {
  user: User;
}

interface ModuleComponentProps {
  user: User;
}

const UniversalDashboard: React.FC<UniversalDashboardProps> = ({ user }) => {
  const userModules: ModuleKey[] = getUserModules(user.role);
  
  // Get the first available module as default route
  const defaultModule: ModuleKey | undefined = userModules[0];
  const defaultPath: string = defaultModule ? `/dashboard/${defaultModule.replace('_', '-')}` : '/dashboard/profile';

  // Component mapping with proper typing
  const componentMap: Record<ModuleKey, React.ComponentType<ModuleComponentProps>> = {
    overview: Overview,
    user_management: UserManagement,
    instructor_management: InstructorManagement,
    transactions: Transactions,
    business_settings: BusinessSettings,
    forms: Forms,
    article_editor: ArticleEditor,
    assigned_bookings: AssignedBookings,
    booking_management: BookingManagement,
    user_data: UserData,
    weekly_schedule: WeeklySchedule,
    financial_data: FinancialData,
    comment_moderation: CommentModeration,
    article_review: ArticleReview,
    profile: UserProfile
  };

  // Protected Route Component
  interface ProtectedModuleRouteProps {
    moduleKey: ModuleKey;
    component: React.ComponentType<ModuleComponentProps>;
  }

  const ProtectedModuleRoute: React.FC<ProtectedModuleRouteProps> = ({ 
    moduleKey, 
    component: Component 
  }) => {
    if (!hasModuleAccess(user.role, moduleKey)) {
      return (
        <div className="unauthorized">
          <h2>Access Denied</h2>
          <p>You don't have permission to access this module.</p>
        </div>
      );
    }
    return <Component user={user} />;
  };

  return (
    <div className="dashboard-container">
      <aside className="dashboard-sidebar">
        <RoleBasedNavigation user={user} />
      </aside>
      
      <main className="dashboard-content">
        <Suspense fallback={<div className="loading">Loading...</div>}>
          <Routes>
            {/* Default redirect */}
            <Route path="/dashboard" element={<Navigate to={defaultPath} replace />} />
            
            {/* Dynamic routes based on user role */}
            {Object.entries(componentMap).map(([moduleKey, Component]) => {
              const path: string = `/dashboard/${moduleKey.replace('_', '-')}`;
              return (
                <Route 
                  key={moduleKey}
                  path={path}
                  element={
                    <ProtectedModuleRoute 
                      moduleKey={moduleKey as ModuleKey} 
                      component={Component} 
                    />
                  }
                />
              );
            })}
            
            {/* Fallback route */}
            <Route path="*" element={<div>Module not found</div>} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
};

export default UniversalDashboard;