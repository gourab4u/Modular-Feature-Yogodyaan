// Role-based module configuration
export const ROLE_MODULES = {
    super_admin: [
        { id: 'user_management', title: 'User Management', component: 'UserManagement', icon: 'users', order: 2 },
        { id: 'rate_management', title: 'Rate Management', component: 'InstructorRatesPage', icon: 'dollar-sign', order: 4 },
        { id: 'class_assignment', title: 'Class Management', component: 'ClassAssignmentManager', icon: 'edit', order: 5 },
        { id: 'article_management', title: 'Article Management', component: 'ArticleManagement', icon: 'book', order: 6 },
        { id: 'transaction_management', title: 'Transactions', component: 'TransactionManagement', icon: 'credit-card', order: 7 },
        { id: 'business_settings', title: 'Business Settings', component: 'BusinessSettings', icon: 'settings', order: 8 },
        { id: 'booking_management', title: 'Class Bookings', component: 'BookingManagement', icon: 'calendar', order: 9 },
        { id: 'weekly_schedule', title: 'Weekly Schedule', component: 'WeeklySchedule', icon: 'schedule', order: 10 },
        { id: 'financial_data', title: 'Financial Data', component: 'FinancialData', icon: 'bar-chart', order: 11 },
        { id: 'form_submission', title: 'Form Submissions & Messages', component: 'FormSubmissions', icon: 'file-text', order: 12 },
        { id: 'class_type_manager', title: 'Class & Package Manager', component: 'ClassTypeManager', icon: 'layers', order: 13 },
        { id: 'newsletterManagement', title: 'NewsLetter Management', component: 'NewsletterManagement', icon: 'mail', order: 14 },
    ],
    admin: [
        { id: 'overview', title: 'Overview', component: 'Overview', icon: 'dashboard', order: 1 },
        { id: 'user_management', title: 'User Management', component: 'UserManagement', icon: 'users', order: 2 },
        { id: 'instructor_management', title: 'Instructor Management', component: 'InstructorManagement', icon: 'teacher', order: 3 },
        { id: 'rate_management', title: 'Rate Management', component: 'InstructorRatesPage', icon: 'dollar-sign', order: 4 },
        { id: 'transactions', title: 'Transactions', component: 'Transactions', icon: 'credit-card', order: 5 },
        { id: 'business_settings', title: 'Business Settings', component: 'BusinessSettings', icon: 'settings', order: 6 },
        { id: 'article_editing', title: 'Article Editing', component: 'ArticleEditing', icon: 'edit', order: 7 },
        { id: 'forms', title: 'Forms', component: 'Forms', icon: 'file-text', order: 9 },
        { id: 'class_type_manager', title: 'Class & Package Manager', component: 'ClassTypeManager', icon: 'layers', order: 8 }
    ],
    instructor: [
        { id: 'teaching_dashboard', title: 'Teaching Dashboard', component: 'TeachingDashboard', icon: 'graduation-cap', order: 1 },
        { id: 'article_management', title: 'Article Management', component: 'ArticleManagement', icon: 'book', order: 2 },
        { id: 'user_profile', title: 'User Profile', component: 'UserProfile', icon: 'user', order: 3 }
    ],
    yoga_acharya: [
        { id: 'teaching_dashboard', title: 'Teaching Dashboard', component: 'TeachingDashboard', icon: 'graduation-cap', order: 1 },
        { id: 'class_assignment', title: 'Class Management', component: 'ClassAssignmentManager', icon: 'edit', order: 3 },
        { id: 'article_management', title: 'Article Management', component: 'ArticleManagement', icon: 'book', order: 4 },
        { id: 'weekly_schedule', title: 'Weekly Schedule', component: 'WeeklySchedule', icon: 'schedule', order: 5 },
        { id: 'class_type_manager', title: 'Class & Package Manager', component: 'ClassTypeManager', icon: 'layers', order: 6 },
    ],
    energy_exchange_lead: [
        { id: 'financial_data', title: 'Financial Data', component: 'FinancialData', icon: 'bar-chart', order: 1 },
        { id: 'transaction_management', title: 'Transactions', component: 'TransactionManagement', icon: 'credit-card', order: 2 }
    ],
    sangha_guide: [
        { id: 'comment_moderation', title: 'Comment Moderation', component: 'CommentModeration', icon: 'message-square', order: 1 },
        { id: 'article_editing', title: 'Article Editing', component: 'ArticleEditing', icon: 'edit', order: 3 },
        { id: 'content_review', title: 'Content Review', component: 'ContentReview', icon: 'check-circle', order: 4 },
        { id: 'article_workflow', title: 'Article Workflow', component: 'ArticleWorkflow', icon: 'CheckCircle', order: 5 }
    ],
    user: [
        { id: 'article_management', title: 'Article Management', component: 'ArticleManagement', icon: 'book', order: 5 },
        { id: 'user_profile', title: 'User Profile', component: 'UserProfile', icon: 'user', order: 6 },
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
