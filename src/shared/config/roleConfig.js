// src/shared/config/roleConfig.ts
export const ROLE_MODULES = {
    super_admin: [
        { id: 'overview', title: 'Overview', component: 'Overview', icon: 'dashboard', order: 1 },
        { id: 'user_management', title: 'User Management', component: 'UserManagement', icon: 'users', order: 2 },
        { id: 'instructor_management', title: 'Instructor Management', component: 'InstructorManagement', icon: 'teacher', order: 3 },
        { id: 'class_assignment', title: 'Class Management', component: 'ClassAssignmentManager', icon: 'edit', order: 4 },
        { id: 'article_management', title: 'Article Management', component: 'ArticleManagement', icon: 'book', order: 5 },
        { id: 'transaction_management', title: 'Transactions', component: 'TransactionManagement', icon: 'credit-card', order: 6 },
        { id: 'business_settings', title: 'Business Settings', component: 'BusinessSettings', icon: 'settings', order: 7 },
        { id: 'booking_management', title: 'Class Bookings', component: 'BookingManagement', icon: 'calendar', order: 8 },
        { id: 'weekly_schedule', title: 'Weekly Schedule', component: 'WeeklySchedule', icon: 'schedule', order: 9 },
        { id: 'financial_data', title: 'Financial Data', component: 'FinancialData', icon: 'bar-chart', order: 10 },
        { id: 'form_submission', title: 'Form Submissions & Messages', component: 'FormSubmissions', icon: 'file-text', order: 11 },
        { id: 'class_type_manager', title: 'Class Type Manager', component: 'ClassTypeManager', icon: 'layers', order: 99 }
    ],
    admin: [
        { id: 'overview', title: 'Overview', component: 'Overview', icon: 'dashboard', order: 1 },
        { id: 'user_management', title: 'User Management', component: 'UserManagement', icon: 'users', order: 2 },
        { id: 'instructor_management', title: 'Instructor Management', component: 'InstructorManagement', icon: 'teacher', order: 3 },
        { id: 'transactions', title: 'Transactions', component: 'Transactions', icon: 'credit-card', order: 4 },
        { id: 'business_settings', title: 'Business Settings', component: 'BusinessSettings', icon: 'settings', order: 5 },
        { id: 'article_editing', title: 'Article Editing', component: 'ArticleEditing', icon: 'edit', order: 6 },
        { id: 'user_profile', title: 'User Profile', component: 'UserProfile', icon: 'user', order: 7 },
        { id: 'forms', title: 'Forms', component: 'Forms', icon: 'file-text', order: 8 },
        { id: 'class_type_manager', title: 'Class Type Manager', component: 'ClassTypeManager', icon: 'layers', order: 99 }
    ],
    instructor: [
        { id: 'assigned_bookings', title: 'My Bookings', component: 'AssignedBookings', icon: 'calendar', order: 1 },
        { id: 'user_profile', title: 'User Profile', component: 'UserProfile', icon: 'user', order: 2 },
        { id: 'article_management', title: 'Article Management', component: 'ArticleManagement', icon: 'book', order: 3 }
    ],
    yoga_acharya: [
        { id: 'instructor_management', title: 'Instructor Management', component: 'InstructorManagement', icon: 'teacher', order: 1 },
        { id: 'class_assignment', title: 'Class Management', component: 'ClassAssignmentManager', icon: 'edit', order: 2 },
        { id: 'article_management', title: 'Article Management', component: 'ArticleManagement', icon: 'book', order: 3 }
    ],
    energy_exchange_lead: [
        { id: 'financial_data', title: 'Financial Data', component: 'FinancialData', icon: 'bar-chart', order: 1 },
        { id: 'transaction_management', title: 'Transactions', component: 'TransactionManagement', icon: 'credit-card', order: 2 },
        { id: 'user_profile', title: 'User Profile', component: 'UserProfile', icon: 'user', order: 3 }
    ],
    sangha_guide: [
        { id: 'comment_moderation', title: 'Comment Moderation', component: 'CommentModeration', icon: 'message-square', order: 1 },
        { id: 'user_profile', title: 'User Profile', component: 'UserProfile', icon: 'user', order: 2 },
        { id: 'article_editing', title: 'Article Editing', component: 'ArticleEditing', icon: 'edit', order: 3 },
        { id: 'content_review', title: 'Content Review', component: 'ContentReview', icon: 'check-circle', order: 4 },
        { id: 'article_workflow', title: 'Article Workflow', component: 'ArticleWorkflow', icon: 'CheckCircle', order: 5 }
    ],
    user: [
        { id: 'user_profile', title: 'User Profile', component: 'UserProfile', icon: 'user', order: 1 },
        { id: 'article_editing', title: 'Article Editing', component: 'ArticleEditing', icon: 'edit', order: 2 }
    ]
};
// Helper function to get modules for a specific role
export const getModulesForRole = (role) => {
    return ROLE_MODULES[role]?.sort((a, b) => a.order - b.order) || [];
};
// Helper function to check if user has access to a specific module
export const hasModuleAccess = (userRole, moduleId) => {
    const modules = getModulesForRole(userRole);
    return modules.some(module => module.id === moduleId);
};
