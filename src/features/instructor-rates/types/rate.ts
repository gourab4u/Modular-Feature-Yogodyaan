export const CATEGORY_TYPES = [
  'individual',
  'corporate',
  'private_group',
  'public_group',
] as const;

export type CategoryType = (typeof CATEGORY_TYPES)[number];

export interface ClassType {
  id: string;
  name: string;
  description: string;
  difficulty_level: string;
  price: number;
  duration_minutes: number;
  max_participants: number;
  is_active: boolean;
}

export interface ClassPackage {
  id: string;
  name: string;
  description?: string;
  class_count: number;
  price: number;
  validity_days?: number;
  is_active: boolean;
  type: 'Individual' | 'Corporate' | 'Private group';
  course_type: 'regular' | 'crash';
  duration?: string;
}

export interface InstructorRate {
  id: string;
  class_type_id?: string; // Optional - for class type rates
  package_id?: string; // Optional - for package rates
  schedule_type: string; // Now flexible text field
  category: CategoryType;
  rate_amount: number; // INR
  rate_amount_usd?: number;
  effective_from: string; // Date string
  effective_until?: string; // Date string
  is_active: boolean;
  created_by: string;
}
