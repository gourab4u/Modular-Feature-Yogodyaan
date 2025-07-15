export interface Instructor {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
    bio?: string;
    specialization?: string;
    experience?: number;
    joinDate?: string;
    certifications?: string[];
    achievements?: string[];
    rating?: number;
    totalClasses?: number;
    profileImage?: string;
    avatar_url?: string;
    created_at?: string;
    user_id?: string;
    full_name?: string;
}

// More specific type for the schedule data structure
export interface ScheduleInstructor {
    user_id: string;
    full_name: string;
    email?: string;
    bio?: string;
    specialization?: string;
    experience?: number;
    created_at?: string;
    avatar_url?: string;
}

// Type for instructor profiles from database
export interface InstructorProfile {
    user_id: string;
    full_name: string;
    email?: string;
    phone?: string;
    bio?: string;
    specialties?: string[];
    experience_years?: number;
    certification?: string;
    avatar_url?: string;
    rating?: number;
    total_classes?: number;
}