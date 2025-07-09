// shared/config/roleConfig.ts
export type UserRole = 
  | 'user' 
  | 'admin' 
  | 'super_user' 
  | 'instructor' 
  | 'yoga_acharya' 
  | 'energy_exchange_lead' 
  | 'sangha_guide';

export type ModuleKey = 
  | 'overview'
  | 'user_management'
  | 'instructor_management'
  | 'transactions'
  | 'business_settings'
  | 'forms'
  | 'article_editor'
  | 'assigned_bookings'
  | 'booking_management'
  | 'user_data'
  | 'weekly_schedule'
  | 'financial_data'
  | 'comment_moderation'
  | 'article_review'
  | 'profile';

export interface ModuleConfig {
  title: string;
  icon: string;
  component: string;
  path: string;
}

export interface RoleConfig {
  modules: ModuleKey[];
  label: string;
}

export const ROLE_PERMISSIONS: Record<UserRole, RoleConfig> = {
  user: {
    modules: ['article_editor', 'profile'],
    label: 'User Dashboard'
  },
  admin: {
    modules: ['overview', 'user_management', 'instructor_management', 'transactions', 'business_settings', 'forms', 'profile'],
    label: 'Admin Dashboard'
  },
  super_user: {
    modules: ['overview', 'user_management', 'instructor_management', 'transactions', 'business_settings', 'forms', 'article_editor', 'booking_management', 'weekly_schedule', 'financial_data', 'comment_moderation', 'profile'],
    label: 'Super User Dashboard'
  },
  instructor: {
    modules: ['assigned_bookings', 'user_data', 'profile'],
    label: 'Instructor Dashboard'
  },
  yoga_acharya: {
    modules: ['booking_management', 'instructor_management', 'weekly_schedule', 'profile'],
    label: 'Yoga Acharya Dashboard'
  },
  energy_exchange_lead: {
    modules: ['financial_data', 'transactions', 'profile'],
    label: 'Energy Exchange Dashboard'
  },
  sangha_guide: {
    modules: ['comment_moderation', 'article_review', 'profile'],
    label: 'Sangha Guide Dashboard'
  }
};

export const MODULE_CONFIG: Record<ModuleKey, ModuleConfig> = {
  overview: {
    title: 'Overview',
    icon: 'BarChart3',
    component: 'Overview',
    path: '/dashboard/overview'
  },
  user_management: {
    title: 'User Management',
    icon: 'Users',
    component: 'UserManagement',
    path: '/dashboard/users'
  },
  instructor_management: {
    title: 'Instructor Management',
    icon: 'UserCheck',
    component: 'InstructorManagement',
    path: '/dashboard/instructors'
  },
  transactions: {
    title: 'Transactions',
    icon: 'CreditCard',
    component: 'Transactions',
    path: '/dashboard/transactions'
  },
  business_settings: {
    title: 'Business Settings',
    icon: 'Settings',
    component: 'BusinessSettings',
    path: '/dashboard/settings'
  },
  forms: {
    title: 'Forms',
    icon: 'FileText',
    component: 'Forms',
    path: '/dashboard/forms'
  },
  article_editor: {
    title: 'My Articles',
    icon: 'Edit',
    component: 'ArticleEditor',
    path: '/dashboard/articles'
  },
  assigned_bookings: {
    title: 'My Bookings',
    icon: 'Calendar',
    component: 'AssignedBookings',
    path: '/dashboard/my-bookings'
  },
  booking_management: {
    title: 'Booking Management',
    icon: 'CalendarCheck',
    component: 'BookingManagement',
    path: '/dashboard/bookings'
  },
  user_data: {
    title: 'User Data',
    icon: 'Database',
    component: 'UserData',
    path: '/dashboard/user-data'
  },
  weekly_schedule: {
    title: 'Weekly Schedule',
    icon: 'Calendar',
    component: 'WeeklySchedule',
    path: '/dashboard/schedule'
  },
  financial_data: {
    title: 'Financial Data',
    icon: 'TrendingUp',
    component: 'FinancialData',
    path: '/dashboard/financial'
  },
  comment_moderation: {
    title: 'Comment Moderation',
    icon: 'MessageSquare',
    component: 'CommentModeration',
    path: '/dashboard/comments'
  },
  article_review: {
    title: 'Article Review',
    icon: 'FileCheck',
    component: 'ArticleReview',
    path: '/dashboard/article-review'
  },
  profile: {
    title: 'Profile',
    icon: 'User',
    component: 'UserProfile',
    path: '/dashboard/profile'
  }
};

// Helper functions
export const getUserModules = (userRole: UserRole): ModuleKey[] => {
  const roleConfig = ROLE_PERMISSIONS[userRole];
  return roleConfig ? roleConfig.modules : [];
};

export const hasModuleAccess = (userRole: UserRole, moduleKey: ModuleKey): boolean => {
  const userModules = getUserModules(userRole);
  return userModules.includes(moduleKey);
};

export const getDashboardLabel = (userRole: UserRole): string => {
  const roleConfig = ROLE_PERMISSIONS[userRole];
  return roleConfig ? roleConfig.label : 'Dashboard';
};

export interface ModuleWithConfig extends ModuleConfig {
  key: ModuleKey;
}

export const getModulesByRole = (userRole: UserRole): ModuleWithConfig[] => {
  const modules = getUserModules(userRole);
  return modules.map(moduleKey => ({
    key: moduleKey,
    ...MODULE_CONFIG[moduleKey]
  }));
};