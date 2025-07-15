export interface Instructor {
  id: string;
  fullName?: string;
  email: string;
  phone?: string;
  profileImage?: string;
  bio?: string;
  specialization?: string;
  experience?: number;
  joinDate?: string;
  certifications?: string[];
  achievements?: string[];
  socialLinks?: {
    website?: string;
    instagram?: string;
    youtube?: string;
  };
  rating?: number;
  totalClasses?: number;
}
