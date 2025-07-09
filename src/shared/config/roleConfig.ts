// src/shared/config/roleConfig.ts

export type UserRole = 
  | 'admin' 
  | 'super_user' 
  | 'instructor' 
  | 'yoga_acharya' 
  | 'energy_exchange_lead' 
  | 'sangha_guide' 
  | 'user';

export type DashboardModule = 
  | 'overview'
  | 'user_management'
  | 'instructor_management'
  | 'transactions'
  | 'business_settings'
  | 'article_editing'
  | 'user_profile'
  | 'bookings'
  | 'assigned_bookings'
  | 'weekly_schedule'
  | 'financial_data'
  | 'forms'
  | 'comment_moderation';

export interface ModuleConfig {
  id: DashboardModule;
  title: string;
  component: string; // Component name to lazy load
  icon?: string;
  description?: string;
  order: number;
}

export const ROLE_MODULES: Record<UserRole, ModuleConfig[]> = {
  super_user: [
    { id: 'overview', title: 'Overview', component: 'Overview', icon: 'dashboard', order: 1 },
    { id: 'user_management', title: 'User Management', component: 'UserManagement', icon: 'users', order: 2 },
    { id: 'instructor_management', title: 'Instructor Management', component: 'InstructorManagement', icon: 'teacher', order: 3 },
    { id: 'transactions', title: 'Transactions', component: 'Transactions', icon: 'credit-card', order: 4 },
    { id: 'business_settings', title: 'Business Settings', component: 'BusinessSettings', icon: 'settings', order: 5 },
    { id: 'article_editing', title: 'Article Editing', component: 'ArticleEditing', icon: 'edit', order: 6 },
    { id: 'user_profile', title: 'User Profile', component: 'UserProfile', icon: 'user', order: 7 },
    { id: 'bookings', title: 'Bookings', component: 'Bookings', icon: 'calendar', order: 8 },
    { id: 'weekly_schedule', title: 'Weekly Schedule', component: 'WeeklySchedule', icon: 'schedule', order: 9 },
    { id: 'financial_data', title: 'Financial Data', component: 'FinancialData', icon: 'bar-chart', order: 10 },
    { id: 'forms', title: 'Forms', component: 'Forms', icon: 'file-text', order: 11 },
    { id: 'comment_moderation', title: 'Comment Moderation', component: 'CommentModeration', icon: 'message-square', order: 12 }
  ],
  
  admin: [
    { id: 'overview', title: 'Overview', component: 'Overview', icon: 'dashboard', order: 1 },
    { id: 'user_management', title: 'User Management', component: 'UserManagement', icon: 'users', order: 2 },
    { id: 'instructor_management', title: 'Instructor Management', component: 'InstructorManagement', icon: 'teacher', order: 3 },
    { id: 'transactions', title: 'Transactions', component: 'Transactions', icon: 'credit-card', order: 4 },
    { id: 'business_settings', title: 'Business Settings', component: 'BusinessSettings', icon: 'settings', order: 5 },
    { id: 'article_editing', title: 'Article Editing', component: 'ArticleEditing', icon: 'edit', order: 6 },
    { id: 'user_profile', title: 'User Profile', component: 'UserProfile', icon: 'user', order: 7 },
    { id: 'forms', title: 'Forms', component: 'Forms', icon: 'file-text', order: 8 }
  ],

  instructor: [
    { id: 'assigned_bookings', title: 'My Bookings', component: 'AssignedBookings', icon: 'calendar', order: 1 },
    { id: 'user_profile', title: 'User Profile', component: 'UserProfile', icon: 'user', order: 2 },
    { id: 'article_editing', title: 'Article Editing', component: 'ArticleEditing', icon: 'edit', order: 3 }
  ],

  yoga_acharya: [
    { id: 'bookings', title: 'Bookings', component: 'Bookings', icon: 'calendar', order: 1 },
    { id: 'instructor_management', title: 'Instructor Management', component: 'InstructorManagement', icon: 'teacher', order: 2 },
    { id: 'weekly_schedule', title: 'Weekly Schedule', component: 'WeeklySchedule', icon: 'schedule', order: 3 },
    { id: 'user_profile', title: 'User Profile', component: 'UserProfile', icon: 'user', order: 4 },
    { id: 'article_editing', title: 'Article Editing', component: 'ArticleEditing', icon: 'edit', order: 5 }
  ],

  energy_exchange_lead: [
    { id: 'financial_data', title: 'Financial Data', component: 'FinancialData', icon: 'bar-chart', order: 1 },
    { id: 'transactions', title: 'Transactions', component: 'Transactions', icon: 'credit-card', order: 2 },
    { id: 'user_profile', title: 'User Profile', component: 'UserProfile', icon: 'user', order: 3 },
    { id: 'article_editing', title: 'Article Editing', component: 'ArticleEditing', icon: 'edit', order: 4 }
  ],

  sangha_guide: [
    { id: 'comment_moderation', title: 'Comment Moderation', component: 'CommentModeration', icon: 'message-square', order: 1 },
    { id: 'user_profile', title: 'User Profile', component: 'UserProfile', icon: 'user', order: 2 },
    { id: 'article_editing', title: 'Article Editing', component: 'ArticleEditing', icon: 'edit', order: 3 }
  ],

  user: [
    { id: 'user_profile', title: 'User Profile', component: 'UserProfile', icon: 'user', order: 1 },
    { id: 'article_editing', title: 'Article Editing', component: 'ArticleEditing', icon: 'edit', order: 2 }
  ]
};

// Helper function to get modules for a specific role
export const getModulesForRole = (role: UserRole): ModuleConfig[] => {
  return ROLE_MODULES[role]?.sort((a, b) => a.order - b.order) || [];
};

// Helper function to check if user has access to a specific module
export const hasModuleAccess = (userRole: UserRole, moduleId: DashboardModule): boolean => {
  const modules = getModulesForRole(userRole);
  return modules.some(module => module.id === moduleId);
};