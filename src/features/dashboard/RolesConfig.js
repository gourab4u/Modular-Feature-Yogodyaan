// src/shared/config/roleConfig.ts
import { Settings } from "lucide-react";
import { ROLE_MODULES } from "../../shared/config/roleConfig";
import ClassTypeManager from "./components/Modules/ClassTypeManager";
import UserManagement from "./components/Modules/UserManagement";
export const RolesConfig = {
    super_admin: {
        modules: [
            { id: 'dashboard', title: 'Dashboard', component: 'Dashboard', icon: 'home', order: 1 },
            { id: 'user_management', title: 'User Management', component: UserManagement, icon: 'users', order: 2 },
            { id: 'role_management', title: 'Role Management', component: 'RoleManagement', icon: 'shield', order: 3 },
            { id: 'class_schedule_manager', title: 'Class Schedule Manager', component: 'ClassScheduleManager', icon: 'calendar', order: 4 },
            { id: 'payment_management', title: 'Payment Management', component: 'PaymentManagement', icon: 'credit-card', order: 5 },
            { id: 'report_management', title: 'Report Management', component: 'ReportManagement', icon: 'bar-chart', order: 6 },
            { id: 'class_type_manager', title: 'Class Type Manager', component: ClassTypeManager, icon: 'layers', order: 99 }
        ]
    },
    admin: {
        modules: [
            { id: 'dashboard', title: 'Dashboard', component: 'Dashboard', icon: 'home', order: 1 },
            { id: 'user_management', title: 'User Management', component: UserManagement, icon: 'users', order: 2 },
            { id: 'role_management', title: 'Role Management', component: 'RoleManagement', icon: 'shield', order: 3 },
            { id: 'class_schedule_manager', title: 'Class Schedule Manager', component: 'ClassScheduleManager', icon: 'calendar', order: 4 },
            { id: 'payment_management', title: 'Payment Management', component: 'PaymentManagement', icon: 'credit-card', order: 5 },
            { id: 'report_management', title: 'Report Management', component: 'ReportManagement', icon: 'bar-chart', order: 6 },
            { id: 'class_type_manager', title: 'Class Type Manager', component: ClassTypeManager, icon: 'layers', order: 99 },
        ]
    },
    yoga_acharya: {
        modules: [
            { id: 'dashboard', title: 'Dashboard', component: 'Dashboard', icon: 'home', order: 1 },
            { id: 'class_schedule_manager', title: 'Class Schedule Manager', component: 'ClassScheduleManager', icon: 'calendar', order: 2 },
            { id: 'settings', title: 'Settings', component: Settings, icon: 'cog', order: 3 },
            { id: 'class_type_manager', title: 'Class Type Manager', component: ClassTypeManager, icon: 'layers', order: 4 }
        ]
    },
    instructor: {
        modules: [
            { id: 'dashboard', title: 'Dashboard', component: 'Dashboard', icon: 'home', order: 1 },
            { id: 'class_schedule_manager', title: 'Class Schedule Manager', component: 'ClassScheduleManager', icon: 'calendar', order: 4 },
            { id: 'settings', title: 'Settings', component: Settings, icon: 'cog', order: 99 },
        ]
    },
    user: {
        modules: [
            { id: 'dashboard', title: 'Dashboard', component: 'Dashboard', icon: 'home', order: 1 },
            { id: 'settings', title: 'Settings', component: Settings, icon: 'cog', order: 99 },
        ]
    },
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
