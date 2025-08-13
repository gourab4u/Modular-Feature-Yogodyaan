# Class Assignment Manager - Technical & Admin Guide

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [API Reference](#api-reference)
4. [Configuration Management](#configuration-management)
5. [Security Implementation](#security-implementation)
6. [Performance Optimization](#performance-optimization)
7. [Monitoring and Logging](#monitoring-and-logging)
8. [Deployment Guide](#deployment-guide)
9. [Maintenance Procedures](#maintenance-procedures)
10. [Troubleshooting Guide](#troubleshooting-guide)
11. [System Integration](#system-integration)
12. [Development Guide](#development-guide)

---

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer                           │
├─────────────────┬─────────────────┬─────────────────────────┤
│  React Components│   Custom Hooks  │   Context/State Mgmt   │
│  - Main Manager  │   - Data Fetch   │   - Global State       │
│  - Forms         │   - Form Handler │   - User Context       │
│  - Views         │   - Validation   │   - Auth Context       │
│  - Modals        │   - Utilities    │   - Theme Context      │
└─────────────────┴─────────────────┴─────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                   Service Layer                             │
├─────────────────┬─────────────────┬─────────────────────────┤
│ Business Logic  │   Data Services │    External Integrations│
│ - Assignment    │   - CRUD Ops    │    - Payment Gateway    │
│   Creation      │   - Validation  │    - Email Service      │
│ - Conflict      │   - Transform   │    - SMS Service        │
│   Detection     │   - Cache       │    - Calendar API       │
│ - Payment Calc  │   - Sync        │    - Notification API   │
└─────────────────┴─────────────────┴─────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                   Database Layer                            │
├─────────────────┬─────────────────┬─────────────────────────┤
│  PostgreSQL     │   Supabase      │    Edge Functions       │
│  - Core Tables  │   - Auth        │    - Triggers           │
│  - Indexes      │   - RLS         │    - Scheduled Jobs     │
│  - Constraints  │   - Real-time   │    - Webhooks           │
│  - Triggers     │   - Storage     │    - Background Tasks   │
└─────────────────┴─────────────────┴─────────────────────────┘
```

### Component Hierarchy

```
ClassAssignmentManager (Root)
├── useClassAssignmentData (Data Hook)
├── useFormHandler (Form Hook)
├── AssignmentForm
│   ├── AssignmentTypeSelector
│   ├── ClassTypePackageSelector
│   ├── AdaptiveBookingSelector
│   │   ├── BookingSelector
│   │   └── MultipleBookingSelector
│   └── ManualCalendarSelector
├── AssignmentListView
│   ├── AdvancedFilters
│   └── ClassDetailsPopup
├── CalendarView
├── AnalyticsView
└── EditAssignmentModal
    └── MultipleBookingSelector
```

### Data Flow Architecture

```
User Action → Component Event → Hook Handler → Service Layer → Database
     ↓              ↓               ↓              ↓            ↓
UI Update ← Component Re-render ← State Update ← Response ← Database Result
```

---

## Database Schema

### Core Tables

#### class_assignments
```sql
CREATE TABLE class_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_type_id UUID REFERENCES class_types(id),
    package_id UUID REFERENCES packages(id),
    instructor_id UUID REFERENCES user_profiles(user_id) NOT NULL,
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    payment_amount DECIMAL(10,2) DEFAULT 0,
    payment_type TEXT DEFAULT 'per_class',
    schedule_type TEXT NOT NULL,
    booking_type TEXT DEFAULT 'individual',
    class_status TEXT DEFAULT 'scheduled' CHECK (class_status IN ('scheduled', 'completed', 'cancelled')),
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'cancelled')),
    instructor_status TEXT DEFAULT 'pending' CHECK (instructor_status IN ('pending', 'accepted', 'rejected')),
    instructor_response_at TIMESTAMPTZ,
    notes TEXT,
    assigned_by UUID REFERENCES auth.users(id) NOT NULL,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_class_assignments_instructor_date (instructor_id, date),
    INDEX idx_class_assignments_date_time (date, start_time, end_time),
    INDEX idx_class_assignments_status (class_status, payment_status),
    INDEX idx_class_assignments_type (schedule_type, booking_type),
    
    -- Constraints
    CONSTRAINT valid_time_range CHECK (
        (start_time IS NULL AND end_time IS NULL) OR 
        (start_time IS NOT NULL AND end_time IS NOT NULL AND start_time < end_time)
    ),
    CONSTRAINT valid_schedule_type CHECK (
        schedule_type IN ('adhoc', 'weekly', 'monthly', 'crash', 'package')
    ),
    CONSTRAINT valid_booking_type CHECK (
        booking_type IN ('individual', 'corporate', 'private_group', 'public_group')
    )
);
```

#### assignment_bookings (Junction Table)
```sql
CREATE TABLE assignment_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES class_assignments(id) ON DELETE CASCADE,
    booking_id TEXT NOT NULL, -- YOG-YYYYMMDD-XXXX format
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicate associations
    UNIQUE(assignment_id, booking_id),
    
    -- Index for efficient lookups
    INDEX idx_assignment_bookings_assignment (assignment_id),
    INDEX idx_assignment_bookings_booking (booking_id)
);
```

#### Supporting Tables

**bookings**:
```sql
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id TEXT UNIQUE NOT NULL, -- YOG-YYYYMMDD-XXXX
    user_id UUID REFERENCES auth.users(id),
    class_name TEXT NOT NULL,
    instructor TEXT,
    class_date DATE,
    class_time TIME,
    preferred_days TEXT[], -- Array of preferred days
    preferred_times TEXT[], -- Array of preferred times
    timezone TEXT DEFAULT 'Asia/Kolkata',
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email EMAIL NOT NULL,
    phone TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    booking_type TEXT DEFAULT 'individual',
    class_package_id UUID REFERENCES packages(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**class_types**:
```sql
CREATE TABLE class_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    difficulty_level TEXT DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    duration_minutes INTEGER DEFAULT 60,
    max_participants INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**packages**:
```sql
CREATE TABLE packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    class_count INTEGER NOT NULL,
    validity_days INTEGER DEFAULT 30,
    duration TEXT, -- "1 month", "3 months", etc.
    course_type TEXT DEFAULT 'regular' CHECK (course_type IN ('regular', 'crash')),
    type TEXT, -- Package category
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**class_schedules** (Weekly Templates):
```sql
CREATE TABLE class_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_type_id UUID REFERENCES class_types(id) NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    instructor_id UUID REFERENCES user_profiles(user_id),
    duration_minutes INTEGER DEFAULT 60,
    max_participants INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT TRUE,
    effective_from DATE DEFAULT CURRENT_DATE,
    effective_until DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent overlapping schedules
    CONSTRAINT no_time_overlap EXCLUDE USING GIST (
        instructor_id WITH =,
        day_of_week WITH =,
        tsrange(start_time::text::timestamp, end_time::text::timestamp) WITH &&
    ) WHERE (is_active = TRUE)
);
```

### Database Views

#### assignment_details (Optimized Query View)
```sql
CREATE VIEW assignment_details AS
SELECT 
    ca.*,
    ct.name as class_type_name,
    ct.difficulty_level,
    p.name as package_name,
    p.class_count,
    p.validity_days,
    up.full_name as instructor_name,
    up.email as instructor_email,
    COUNT(ab.booking_id) as booking_count,
    ARRAY_AGG(ab.booking_id) FILTER (WHERE ab.booking_id IS NOT NULL) as booking_ids
FROM class_assignments ca
LEFT JOIN class_types ct ON ca.class_type_id = ct.id
LEFT JOIN packages p ON ca.package_id = p.id
LEFT JOIN user_profiles up ON ca.instructor_id = up.user_id
LEFT JOIN assignment_bookings ab ON ca.id = ab.assignment_id
GROUP BY ca.id, ct.id, p.id, up.user_id;
```

### Database Triggers

#### Update Timestamps
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_class_assignments_updated_at 
    BEFORE UPDATE ON class_assignments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### Booking Status Updates
```sql
CREATE OR REPLACE FUNCTION update_booking_status_on_assignment()
RETURNS TRIGGER AS $$
BEGIN
    -- Update booking status when assignment is created
    IF TG_OP = 'INSERT' THEN
        UPDATE bookings 
        SET status = 'confirmed', updated_at = NOW()
        WHERE booking_id = NEW.booking_id;
        RETURN NEW;
    END IF;
    
    -- Revert booking status when assignment is deleted
    IF TG_OP = 'DELETE' THEN
        UPDATE bookings 
        SET status = 'pending', updated_at = NOW()
        WHERE booking_id = OLD.booking_id;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER assignment_booking_status_trigger
    AFTER INSERT OR DELETE ON assignment_bookings
    FOR EACH ROW EXECUTE FUNCTION update_booking_status_on_assignment();
```

---

## API Reference

### Authentication
All API endpoints require valid authentication headers:
```javascript
Authorization: Bearer <supabase_access_token>
```

### Core Assignment Endpoints

#### GET /rest/v1/class_assignments
Fetch assignments with optional filtering and pagination.

**Query Parameters**:
```typescript
interface AssignmentQueryParams {
    // Filtering
    instructor_id?: string
    date?: string
    date_range?: [string, string]
    schedule_type?: string
    booking_type?: string
    class_status?: string
    payment_status?: string
    instructor_status?: string
    
    // Sorting
    order?: string // e.g., "date.asc,start_time.asc"
    
    // Pagination
    limit?: number
    offset?: number
    
    // Relations
    select?: string // e.g., "*,class_types(*),packages(*),user_profiles(*)"
}
```

**Response**:
```typescript
interface AssignmentResponse {
    data: ClassAssignment[]
    count?: number
    error?: null
}
```

#### POST /rest/v1/class_assignments
Create new assignment(s).

**Request Body**:
```typescript
interface CreateAssignmentRequest {
    assignments: Partial<ClassAssignment>[]
    booking_associations?: {
        assignment_temp_id: string
        booking_ids: string[]
    }[]
}
```

**Response**:
```typescript
interface CreateAssignmentResponse {
    data: ClassAssignment[]
    error?: string
}
```

#### PATCH /rest/v1/class_assignments
Update existing assignment.

**Query Parameters**:
- `id=eq.{assignment_id}`: Target specific assignment

**Request Body**:
```typescript
interface UpdateAssignmentRequest {
    class_status?: string
    payment_status?: string
    instructor_status?: string
    payment_amount?: number
    notes?: string
    instructor_response_at?: string
}
```

#### DELETE /rest/v1/class_assignments
Delete assignment(s).

**Query Parameters**:
- `id=eq.{assignment_id}`: Delete specific assignment
- `id=in.({id1},{id2},{id3})`: Delete multiple assignments

### Booking Association Endpoints

#### POST /rest/v1/assignment_bookings
Create booking associations.

**Request Body**:
```typescript
interface CreateBookingAssociationRequest {
    assignment_id: string
    booking_id: string
}[]
```

#### DELETE /rest/v1/assignment_bookings
Remove booking associations.

**Query Parameters**:
- `assignment_id=eq.{assignment_id}`: Remove all associations for assignment
- `booking_id=eq.{booking_id}`: Remove specific booking association

### Analytics Endpoints

#### GET /rest/v1/rpc/assignment_analytics
Get comprehensive assignment analytics.

**Request Body**:
```typescript
interface AnalyticsRequest {
    date_start?: string
    date_end?: string
    instructor_ids?: string[]
    assignment_types?: string[]
}
```

**Response**:
```typescript
interface AnalyticsResponse {
    total_revenue: number
    total_assignments: number
    assignment_distribution: {
        type: string
        count: number
        revenue: number
    }[]
    instructor_stats: {
        instructor_id: string
        instructor_name: string
        assignment_count: number
        total_revenue: number
        completion_rate: number
    }[]
    monthly_trends: {
        month: string
        revenue: number
        assignment_count: number
    }[]
}
```

### Custom RPC Functions

#### assignment_conflict_check
```sql
CREATE OR REPLACE FUNCTION assignment_conflict_check(
    p_instructor_id UUID,
    p_date DATE,
    p_start_time TIME,
    p_end_time TIME,
    p_exclude_assignment_id UUID DEFAULT NULL
)
RETURNS TABLE(
    has_conflict BOOLEAN,
    conflicting_assignment_id UUID,
    conflict_type TEXT,
    conflict_message TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        TRUE as has_conflict,
        ca.id as conflicting_assignment_id,
        'instructor_assignment' as conflict_type,
        format('Instructor has existing assignment: %s at %s', 
               ct.name, ca.start_time) as conflict_message
    FROM class_assignments ca
    JOIN class_types ct ON ca.class_type_id = ct.id
    WHERE ca.instructor_id = p_instructor_id
      AND ca.date = p_date
      AND ca.class_status != 'cancelled'
      AND (p_exclude_assignment_id IS NULL OR ca.id != p_exclude_assignment_id)
      AND (
          (ca.start_time, ca.end_time) OVERLAPS (p_start_time, p_end_time)
      )
    
    UNION ALL
    
    SELECT 
        TRUE as has_conflict,
        NULL as conflicting_assignment_id,
        'instructor_schedule' as conflict_type,
        format('Instructor has weekly schedule: %s at %s', 
               ct.name, cs.start_time) as conflict_message
    FROM class_schedules cs
    JOIN class_types ct ON cs.class_type_id = ct.id
    WHERE cs.instructor_id = p_instructor_id
      AND cs.day_of_week = EXTRACT(DOW FROM p_date)
      AND cs.is_active = TRUE
      AND (cs.effective_from IS NULL OR cs.effective_from <= p_date)
      AND (cs.effective_until IS NULL OR cs.effective_until >= p_date)
      AND (
          (cs.start_time, cs.end_time) OVERLAPS (p_start_time, p_end_time)
      );
      
    -- If no conflicts found, return no conflict
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, NULL::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### bulk_assignment_operations
```sql
CREATE OR REPLACE FUNCTION bulk_assignment_operations(
    operation_type TEXT,
    assignment_ids UUID[],
    update_data JSONB DEFAULT NULL
)
RETURNS TABLE(
    success BOOLEAN,
    affected_count INTEGER,
    error_message TEXT
) AS $$
DECLARE
    affected_rows INTEGER;
BEGIN
    CASE operation_type
        WHEN 'delete' THEN
            DELETE FROM class_assignments 
            WHERE id = ANY(assignment_ids)
              AND assigned_by = auth.uid(); -- Security check
            GET DIAGNOSTICS affected_rows = ROW_COUNT;
            
        WHEN 'update_status' THEN
            UPDATE class_assignments 
            SET 
                class_status = COALESCE((update_data->>'class_status')::TEXT, class_status),
                payment_status = COALESCE((update_data->>'payment_status')::TEXT, payment_status),
                instructor_status = COALESCE((update_data->>'instructor_status')::TEXT, instructor_status),
                updated_at = NOW()
            WHERE id = ANY(assignment_ids)
              AND assigned_by = auth.uid(); -- Security check
            GET DIAGNOSTICS affected_rows = ROW_COUNT;
            
        ELSE
            RETURN QUERY SELECT FALSE, 0, 'Invalid operation type';
            RETURN;
    END CASE;
    
    RETURN QUERY SELECT TRUE, affected_rows, NULL::TEXT;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT FALSE, 0, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Configuration Management

### Environment Variables

```bash
# Database Configuration
DATABASE_URL=postgresql://user:password@host:port/database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Application Configuration
NODE_ENV=production|development|staging
REACT_APP_API_URL=https://api.yourdomain.com
REACT_APP_APP_NAME="Yoga Studio Manager"

# Feature Flags
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_BULK_OPERATIONS=true
REACT_APP_ENABLE_PAYMENT_INTEGRATION=false

# Integration Configuration
PAYMENT_GATEWAY_URL=https://payment.provider.com
PAYMENT_GATEWAY_KEY=your-payment-key
EMAIL_SERVICE_URL=https://email.service.com
EMAIL_SERVICE_KEY=your-email-key
SMS_SERVICE_URL=https://sms.service.com
SMS_SERVICE_KEY=your-sms-key

# Performance Configuration
REACT_APP_PAGE_SIZE=50
REACT_APP_MAX_BULK_OPERATIONS=100
REACT_APP_CACHE_TIMEOUT=300000 # 5 minutes
```

### Application Configuration

```typescript
// config/app.config.ts
export const AppConfig = {
    database: {
        maxRetries: 3,
        retryDelay: 1000,
        timeout: 30000,
        batchSize: 100
    },
    ui: {
        pageSize: Number(process.env.REACT_APP_PAGE_SIZE) || 50,
        maxSelections: Number(process.env.REACT_APP_MAX_BULK_OPERATIONS) || 100,
        cacheTimeout: Number(process.env.REACT_APP_CACHE_TIMEOUT) || 300000,
        refreshInterval: 60000 // 1 minute
    },
    business: {
        minClassDuration: 30, // minutes
        maxClassDuration: 180, // minutes
        defaultClassDuration: 60,
        maxAdvanceBooking: 90, // days
        paymentTypes: [
            'per_class',
            'monthly',
            'per_member',
            'total_duration',
            'per_class_total',
            'per_student_per_class'
        ],
        assignmentTypes: [
            'adhoc',
            'weekly',
            'monthly',
            'crash_course',
            'package'
        ],
        bookingTypes: [
            'individual',
            'corporate',
            'private_group',
            'public_group'
        ]
    },
    features: {
        enableAnalytics: process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
        enableBulkOperations: process.env.REACT_APP_ENABLE_BULK_OPERATIONS === 'true',
        enablePaymentIntegration: process.env.REACT_APP_ENABLE_PAYMENT_INTEGRATION === 'true',
        enableNotifications: true,
        enableConflictDetection: true
    }
}
```

### Database Configuration

```sql
-- Row Level Security Policies
ALTER TABLE class_assignments ENABLE ROW LEVEL SECURITY;

-- Instructors can only see their own assignments
CREATE POLICY instructor_assignments_policy ON class_assignments
    FOR ALL USING (
        instructor_id = auth.uid() OR
        assigned_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND user_id IN (
                SELECT user_id FROM user_roles 
                WHERE role_name IN ('admin', 'manager')
            )
        )
    );

-- Similar policies for other tables...

-- Performance Configurations
SET work_mem = '256MB';
SET max_connections = 200;
SET shared_buffers = '256MB';
SET effective_cache_size = '1GB';
SET maintenance_work_mem = '64MB';
```

---

## Security Implementation

### Authentication & Authorization

#### Supabase Auth Integration
```typescript
// services/auth.service.ts
export class AuthService {
    static async getCurrentUser() {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) throw new Error('Authentication failed')
        return user
    }
    
    static async checkPermission(action: string, resource: string) {
        const user = await this.getCurrentUser()
        if (!user) return false
        
        // Check user roles and permissions
        const { data: userRoles } = await supabase
            .from('user_roles')
            .select('role_name, permissions')
            .eq('user_id', user.id)
            
        return userRoles?.some(role => 
            role.permissions.includes(`${action}:${resource}`)
        ) || false
    }
}
```

#### Permission Matrix
```typescript
const PERMISSIONS = {
    'admin': [
        'create:assignment',
        'read:assignment',
        'update:assignment',
        'delete:assignment',
        'bulk:assignment',
        'read:analytics',
        'manage:users',
        'manage:settings'
    ],
    'manager': [
        'create:assignment',
        'read:assignment',
        'update:assignment',
        'delete:assignment',
        'bulk:assignment',
        'read:analytics'
    ],
    'instructor': [
        'read:assignment',
        'update:own_assignment',
        'read:own_analytics'
    ],
    'staff': [
        'create:assignment',
        'read:assignment',
        'update:assignment'
    ]
}
```

### Data Security

#### Input Validation & Sanitization
```typescript
// utils/validation.ts
export class ValidationService {
    static validateAssignmentData(data: Partial<ClassAssignment>) {
        const errors: ValidationError[] = []
        
        // Required field validation
        if (!data.instructor_id) {
            errors.push({ field: 'instructor_id', message: 'Instructor is required' })
        }
        
        // UUID validation
        if (data.instructor_id && !this.isValidUUID(data.instructor_id)) {
            errors.push({ field: 'instructor_id', message: 'Invalid instructor ID format' })
        }
        
        // Date validation
        if (data.date && !this.isValidDate(data.date)) {
            errors.push({ field: 'date', message: 'Invalid date format' })
        }
        
        // Time validation
        if (data.start_time && !this.isValidTime(data.start_time)) {
            errors.push({ field: 'start_time', message: 'Invalid time format' })
        }
        
        // Business logic validation
        if (data.payment_amount && data.payment_amount < 0) {
            errors.push({ field: 'payment_amount', message: 'Payment amount cannot be negative' })
        }
        
        return errors
    }
    
    static sanitizeInput(input: string): string {
        return input
            .trim()
            .replace(/[<>]/g, '') // Remove potential HTML tags
            .substring(0, 1000) // Limit length
    }
    
    private static isValidUUID(uuid: string): boolean {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        return uuidRegex.test(uuid)
    }
}
```

#### SQL Injection Prevention
- All database queries use parameterized queries via Supabase client
- Input validation at API layer
- Row Level Security (RLS) policies enforce data access controls
- Prepared statements for complex queries

#### Cross-Site Scripting (XSS) Prevention
```typescript
// utils/security.ts
export class SecurityService {
    static sanitizeHTML(html: string): string {
        const tempDiv = document.createElement('div')
        tempDiv.textContent = html
        return tempDiv.innerHTML
    }
    
    static validateCSRF(token: string): boolean {
        // CSRF token validation logic
        return true // Implement actual validation
    }
    
    static escapeSQL(input: string): string {
        return input.replace(/'/g, "''")
    }
}
```

---

## Performance Optimization

### Database Optimization

#### Index Strategy
```sql
-- Primary indexes for common query patterns
CREATE INDEX CONCURRENTLY idx_assignments_instructor_date 
    ON class_assignments (instructor_id, date);
    
CREATE INDEX CONCURRENTLY idx_assignments_date_range 
    ON class_assignments (date) 
    WHERE class_status != 'cancelled';
    
CREATE INDEX CONCURRENTLY idx_assignments_composite 
    ON class_assignments (schedule_type, booking_type, class_status, date);

-- Partial indexes for filtered queries
CREATE INDEX CONCURRENTLY idx_assignments_active 
    ON class_assignments (instructor_id, date, start_time) 
    WHERE class_status IN ('scheduled', 'completed');

-- Covering indexes for analytics queries
CREATE INDEX CONCURRENTLY idx_assignments_analytics 
    ON class_assignments (date, schedule_type, payment_amount, payment_status) 
    INCLUDE (instructor_id, class_type_id, package_id);
```

#### Query Optimization
```sql
-- Optimized assignment fetch query
EXPLAIN ANALYZE
SELECT 
    ca.*,
    ct.name as class_type_name,
    p.name as package_name,
    up.full_name as instructor_name,
    COUNT(ab.booking_id) as booking_count
FROM class_assignments ca
LEFT JOIN class_types ct ON ca.class_type_id = ct.id
LEFT JOIN packages p ON ca.package_id = p.id
LEFT JOIN user_profiles up ON ca.instructor_id = up.user_id
LEFT JOIN assignment_bookings ab ON ca.id = ab.assignment_id
WHERE ca.date >= CURRENT_DATE - INTERVAL '30 days'
  AND ca.date <= CURRENT_DATE + INTERVAL '90 days'
GROUP BY ca.id, ct.id, p.id, up.user_id
ORDER BY ca.date, ca.start_time;
```

### Frontend Optimization

#### React Performance
```typescript
// hooks/useClassAssignmentData.ts
export const useClassAssignmentData = () => {
    // Memoized selectors
    const selectActiveAssignments = useMemo(
        () => createSelector(
            [(assignments: ClassAssignment[]) => assignments],
            (assignments) => assignments.filter(a => a.class_status !== 'cancelled')
        ),
        []
    )
    
    // Efficient data fetching with React Query
    const {
        data: assignments,
        isLoading,
        error,
        refetch
    } = useQuery({
        queryKey: ['assignments', filters],
        queryFn: () => fetchAssignments(filters),
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 10 * 60 * 1000, // 10 minutes
        refetchOnWindowFocus: false
    })
    
    // Virtualization for large lists
    const virtualizedAssignments = useVirtualizer({
        count: assignments?.length || 0,
        getScrollElement: () => scrollElementRef.current,
        estimateSize: () => 80, // Estimated row height
        overscan: 10
    })
    
    return {
        assignments: selectActiveAssignments(assignments || []),
        virtualizedAssignments,
        isLoading,
        error,
        refetch
    }
}
```

#### Bundle Optimization
```javascript
// webpack.config.js optimizations
module.exports = {
    optimization: {
        splitChunks: {
            chunks: 'all',
            cacheGroups: {
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    chunks: 'all',
                },
                classAssignment: {
                    test: /[\\/]src[\\/]features[\\/]dashboard[\\/]components[\\/]Modules[\\/]ClassAssignmentManager[\\/]/,
                    name: 'class-assignment',
                    chunks: 'all',
                },
            },
        },
        usedExports: true,
        sideEffects: false,
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
            '@components': path.resolve(__dirname, 'src/components'),
            '@services': path.resolve(__dirname, 'src/services'),
        }
    }
}
```

#### Lazy Loading
```typescript
// Lazy load heavy components
const AnalyticsView = lazy(() => import('./components/AnalyticsView'))
const CalendarView = lazy(() => import('./components/CalendarView'))

// Component with Suspense
function ClassAssignmentManager() {
    return (
        <div>
            <Suspense fallback={<LoadingSpinner />}>
                {activeView === 'analytics' && <AnalyticsView />}
                {activeView === 'calendar' && <CalendarView />}
            </Suspense>
        </div>
    )
}
```

### Caching Strategy

#### Service Worker Cache
```typescript
// serviceWorker.js
const CACHE_NAME = 'class-assignment-v1'
const urlsToCache = [
    '/static/js/bundle.js',
    '/static/css/main.css',
    '/api/class-types',
    '/api/packages',
    '/api/user-profiles'
]

self.addEventListener('fetch', event => {
    if (event.request.url.includes('/api/assignments')) {
        // Cache assignments with short expiry
        event.respondWith(
            caches.open(CACHE_NAME).then(cache => {
                return cache.match(event.request).then(response => {
                    if (response) {
                        // Check if cached response is still fresh
                        const cachedTime = response.headers.get('cached-time')
                        const now = Date.now()
                        if (now - parseInt(cachedTime) < 300000) { // 5 minutes
                            return response
                        }
                    }
                    
                    // Fetch fresh data
                    return fetch(event.request).then(response => {
                        const responseClone = response.clone()
                        responseClone.headers.set('cached-time', Date.now().toString())
                        cache.put(event.request, responseClone)
                        return response
                    })
                })
            })
        )
    }
})
```

---

## Monitoring and Logging

### Application Monitoring

#### Performance Metrics
```typescript
// utils/monitoring.ts
export class MonitoringService {
    static trackPageLoad(pageName: string, loadTime: number) {
        // Send to analytics service
        analytics.track('page_load', {
            page: pageName,
            load_time: loadTime,
            user_agent: navigator.userAgent,
            timestamp: new Date().toISOString()
        })
    }
    
    static trackUserAction(action: string, metadata: Record<string, any>) {
        analytics.track('user_action', {
            action,
            ...metadata,
            session_id: sessionStorage.getItem('session_id'),
            timestamp: new Date().toISOString()
        })
    }
    
    static trackError(error: Error, context: Record<string, any>) {
        console.error('Application Error:', error, context)
        
        // Send to error tracking service
        errorTracker.captureException(error, {
            tags: {
                module: 'class-assignment-manager',
                severity: 'error'
            },
            extra: context
        })
    }
    
    static trackDatabaseQuery(query: string, duration: number) {
        if (duration > 1000) { // Log slow queries
            console.warn('Slow Query Detected:', {
                query: query.substring(0, 100) + '...',
                duration,
                timestamp: new Date().toISOString()
            })
        }
    }
}
```

#### Health Checks
```typescript
// services/healthCheck.ts
export class HealthCheckService {
    static async checkDatabaseConnectivity(): Promise<boolean> {
        try {
            const { data, error } = await supabase
                .from('class_assignments')
                .select('id')
                .limit(1)
            
            return !error
        } catch {
            return false
        }
    }
    
    static async checkExternalServices(): Promise<Record<string, boolean>> {
        const services = {
            database: await this.checkDatabaseConnectivity(),
            paymentGateway: await this.checkPaymentGateway(),
            emailService: await this.checkEmailService(),
        }
        
        return services
    }
    
    static async generateHealthReport() {
        const services = await this.checkExternalServices()
        const memoryUsage = performance.memory
        
        return {
            timestamp: new Date().toISOString(),
            status: Object.values(services).every(Boolean) ? 'healthy' : 'degraded',
            services,
            performance: {
                memory_used: memoryUsage?.usedJSHeapSize || 0,
                memory_limit: memoryUsage?.jsHeapSizeLimit || 0,
                memory_total: memoryUsage?.totalJSHeapSize || 0
            },
            uptime: Date.now() - performance.timeOrigin
        }
    }
}
```

### Database Monitoring

#### Query Performance Monitoring
```sql
-- Enable query logging
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_min_duration_statement = 1000; -- Log queries > 1 second
ALTER SYSTEM SET log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h ';

-- Create monitoring view
CREATE VIEW slow_queries AS
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements
WHERE query ILIKE '%class_assignments%'
ORDER BY total_time DESC;

-- Monitor table sizes
CREATE VIEW table_sizes AS
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation,
    most_common_vals,
    most_common_freqs,
    histogram_bounds
FROM pg_stats
WHERE tablename IN ('class_assignments', 'assignment_bookings', 'bookings');
```

#### Automated Alerts
```sql
-- Function to check for performance issues
CREATE OR REPLACE FUNCTION check_assignment_performance()
RETURNS void AS $$
DECLARE
    slow_query_count INTEGER;
    large_table_size BIGINT;
BEGIN
    -- Check for slow queries
    SELECT COUNT(*) INTO slow_query_count
    FROM pg_stat_statements
    WHERE query ILIKE '%class_assignments%'
      AND mean_time > 1000; -- > 1 second average
      
    -- Check table size
    SELECT pg_total_relation_size('class_assignments') INTO large_table_size;
    
    -- Send alerts if thresholds exceeded
    IF slow_query_count > 5 THEN
        PERFORM pg_notify('performance_alert', 
            json_build_object(
                'type', 'slow_queries',
                'count', slow_query_count,
                'timestamp', NOW()
            )::text
        );
    END IF;
    
    IF large_table_size > 1073741824 THEN -- > 1GB
        PERFORM pg_notify('performance_alert',
            json_build_object(
                'type', 'large_table',
                'size', large_table_size,
                'table', 'class_assignments',
                'timestamp', NOW()
            )::text
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Schedule regular performance checks
SELECT cron.schedule('performance-check', '*/5 * * * *', 'SELECT check_assignment_performance();');
```

### Error Tracking

#### Error Boundaries
```typescript
// components/ErrorBoundary.tsx
class ClassAssignmentErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; error: Error | null }
> {
    constructor(props: any) {
        super(props)
        this.state = { hasError: false, error: null }
    }
    
    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error }
    }
    
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        MonitoringService.trackError(error, {
            component: 'ClassAssignmentManager',
            errorInfo,
            props: this.props,
            state: this.state
        })
    }
    
    render() {
        if (this.state.hasError) {
            return (
                <div className="error-fallback">
                    <h2>Something went wrong in Class Assignment Manager</h2>
                    <details>
                        {this.state.error?.message}
                    </details>
                    <button onClick={() => window.location.reload()}>
                        Reload Page
                    </button>
                </div>
            )
        }
        
        return this.props.children
    }
}
```

---

## Deployment Guide

### Environment Setup

#### Production Environment
```bash
# Production deployment script
#!/bin/bash

# Set production environment
export NODE_ENV=production
export REACT_APP_ENV=production

# Install dependencies
npm ci --only=production

# Build application
npm run build

# Run tests
npm run test:production

# Deploy to CDN/hosting service
aws s3 sync build/ s3://your-production-bucket --delete
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"

# Deploy database migrations
npm run migrate:production

# Start application
pm2 start ecosystem.config.js --env production
```

#### Staging Environment
```bash
# Staging deployment
export NODE_ENV=staging
export REACT_APP_ENV=staging

npm ci
npm run build:staging
npm run test:e2e
npm run deploy:staging
```

### Database Migrations

#### Migration Scripts
```sql
-- migrations/001_initial_schema.sql
BEGIN;

CREATE TABLE IF NOT EXISTS class_assignments (
    -- Schema definition here
);

CREATE TABLE IF NOT EXISTS assignment_bookings (
    -- Schema definition here
);

-- Add indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assignments_instructor_date 
    ON class_assignments (instructor_id, date);

COMMIT;
```

```sql
-- migrations/002_add_booking_associations.sql
BEGIN;

-- Add new columns
ALTER TABLE class_assignments 
ADD COLUMN IF NOT EXISTS booking_type TEXT DEFAULT 'individual';

-- Update existing data
UPDATE class_assignments 
SET booking_type = 'individual' 
WHERE booking_type IS NULL;

-- Add constraints
ALTER TABLE class_assignments 
ADD CONSTRAINT valid_booking_type 
CHECK (booking_type IN ('individual', 'corporate', 'private_group', 'public_group'));

COMMIT;
```

#### Migration Runner
```typescript
// scripts/migrate.ts
import { supabase } from '../src/shared/lib/supabase'
import fs from 'fs'
import path from 'path'

async function runMigrations() {
    const migrationsDir = path.join(__dirname, 'migrations')
    const migrationFiles = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort()
    
    for (const file of migrationFiles) {
        const migrationSql = fs.readFileSync(
            path.join(migrationsDir, file),
            'utf-8'
        )
        
        console.log(`Running migration: ${file}`)
        
        try {
            const { error } = await supabase.rpc('execute_sql', {
                sql: migrationSql
            })
            
            if (error) {
                throw new Error(`Migration ${file} failed: ${error.message}`)
            }
            
            console.log(`✅ Migration ${file} completed`)
        } catch (error) {
            console.error(`❌ Migration ${file} failed:`, error)
            process.exit(1)
        }
    }
    
    console.log('🎉 All migrations completed successfully')
}

runMigrations()
```

### CI/CD Pipeline

#### GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy Class Assignment Manager

on:
  push:
    branches: [main]
    paths:
      - 'src/features/dashboard/components/Modules/ClassAssignmentManager/**'
      - '.github/workflows/deploy.yml'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run type checking
        run: npm run type-check
      
      - name: Run linting
        run: npm run lint
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
        env:
          REACT_APP_SUPABASE_URL: ${{ secrets.REACT_APP_SUPABASE_URL }}
          REACT_APP_SUPABASE_ANON_KEY: ${{ secrets.REACT_APP_SUPABASE_ANON_KEY }}
      
      - name: Run database migrations
        run: npm run migrate:production
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
      
      - name: Deploy to S3
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Sync to S3
        run: |
          aws s3 sync build/ s3://${{ secrets.S3_BUCKET }} --delete
          aws cloudfront create-invalidation --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} --paths "/*"
      
      - name: Notify deployment success
        uses: 8398a7/action-slack@v3
        with:
          status: success
          text: 'Class Assignment Manager deployed successfully!'
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

---

## Maintenance Procedures

### Regular Maintenance Tasks

#### Weekly Tasks
```bash
# Weekly maintenance script
#!/bin/bash

echo "Starting weekly maintenance..."

# 1. Database maintenance
echo "Running database maintenance..."
psql $DATABASE_URL -c "VACUUM ANALYZE class_assignments;"
psql $DATABASE_URL -c "VACUUM ANALYZE assignment_bookings;"
psql $DATABASE_URL -c "REINDEX TABLE class_assignments;"

# 2. Clean up old data
echo "Cleaning up old data..."
psql $DATABASE_URL -c "
DELETE FROM class_assignments 
WHERE class_status = 'cancelled' 
  AND date < CURRENT_DATE - INTERVAL '6 months';
"

# 3. Update statistics
echo "Updating table statistics..."
psql $DATABASE_URL -c "ANALYZE;"

# 4. Check for orphaned records
echo "Checking for orphaned records..."
psql $DATABASE_URL -c "
SELECT COUNT(*) as orphaned_bookings
FROM assignment_bookings ab
WHERE NOT EXISTS (
    SELECT 1 FROM class_assignments ca 
    WHERE ca.id = ab.assignment_id
);
"

# 5. Generate health report
echo "Generating health report..."
node scripts/generateHealthReport.js

echo "Weekly maintenance completed!"
```

#### Monthly Tasks
```bash
# Monthly maintenance script
#!/bin/bash

echo "Starting monthly maintenance..."

# 1. Archive old assignments
echo "Archiving old assignments..."
psql $DATABASE_URL -c "
INSERT INTO class_assignments_archive
SELECT * FROM class_assignments
WHERE date < CURRENT_DATE - INTERVAL '1 year'
  AND class_status IN ('completed', 'cancelled');
"

# 2. Update performance baselines
echo "Updating performance baselines..."
node scripts/updatePerformanceBaselines.js

# 3. Generate monthly reports
echo "Generating monthly reports..."
node scripts/generateMonthlyReport.js

# 4. Check for unused indexes
echo "Checking for unused indexes..."
psql $DATABASE_URL -c "
SELECT 
    schemaname, 
    tablename, 
    indexname, 
    idx_tup_read, 
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE idx_tup_read = 0 
  AND tablename LIKE '%assignment%';
"

echo "Monthly maintenance completed!"
```

### Backup Procedures

#### Automated Backups
```bash
# backup.sh
#!/bin/bash

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/backups/class-assignments"
mkdir -p $BACKUP_DIR

# 1. Database backup
echo "Creating database backup..."
pg_dump $DATABASE_URL \
    --verbose \
    --format=custom \
    --compress=9 \
    --file="$BACKUP_DIR/assignments_backup_$TIMESTAMP.dump"

# 2. Application configuration backup
echo "Backing up configuration..."
tar -czf "$BACKUP_DIR/config_backup_$TIMESTAMP.tar.gz" \
    config/ \
    .env.production \
    package.json \
    package-lock.json

# 3. Upload to cloud storage
echo "Uploading to cloud storage..."
aws s3 cp "$BACKUP_DIR/assignments_backup_$TIMESTAMP.dump" \
    "s3://your-backup-bucket/class-assignments/"

# 4. Clean up old backups (keep last 30 days)
echo "Cleaning up old backups..."
find $BACKUP_DIR -name "*.dump" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed successfully!"
```

### Recovery Procedures

#### Database Recovery
```bash
# restore.sh
#!/bin/bash

if [ -z "$1" ]; then
    echo "Usage: $0 <backup_file>"
    exit 1
fi

BACKUP_FILE=$1

echo "Starting database recovery..."

# 1. Create recovery database
createdb class_assignments_recovery

# 2. Restore from backup
pg_restore \
    --verbose \
    --clean \
    --no-acl \
    --no-owner \
    --dbname=class_assignments_recovery \
    "$BACKUP_FILE"

# 3. Verify data integrity
echo "Verifying data integrity..."
psql class_assignments_recovery -c "
SELECT 
    COUNT(*) as assignment_count,
    MIN(date) as earliest_date,
    MAX(date) as latest_date
FROM class_assignments;
"

# 4. Run post-recovery validation
node scripts/validateRecovery.js

echo "Recovery completed. Please verify data before switching databases."
```

---

## Troubleshooting Guide

### Common Production Issues

#### High Memory Usage
**Symptoms**: Application becomes slow, browser tabs crash, memory warnings
**Causes**: Large datasets, memory leaks, inefficient rendering
**Solutions**:
```typescript
// 1. Implement virtualization for large lists
import { FixedSizeList as List } from 'react-window'

const AssignmentList = ({ assignments }) => (
    <List
        height={600}
        itemCount={assignments.length}
        itemSize={80}
        itemData={assignments}
    >
        {AssignmentRow}
    </List>
)

// 2. Optimize React re-renders
const OptimizedAssignmentRow = React.memo(({ assignment }) => {
    // Component implementation
}, (prevProps, nextProps) => {
    return prevProps.assignment.id === nextProps.assignment.id &&
           prevProps.assignment.updated_at === nextProps.assignment.updated_at
})

// 3. Clean up event listeners
useEffect(() => {
    const handleResize = () => { /* handler */ }
    window.addEventListener('resize', handleResize)
    
    return () => {
        window.removeEventListener('resize', handleResize)
    }
}, [])
```

#### Slow Database Queries
**Symptoms**: Long loading times, timeout errors
**Causes**: Missing indexes, inefficient queries, large datasets
**Solutions**:
```sql
-- 1. Add missing indexes
CREATE INDEX CONCURRENTLY idx_assignments_date_instructor 
ON class_assignments (date, instructor_id) 
WHERE class_status != 'cancelled';

-- 2. Optimize query with proper joins
SELECT 
    ca.id,
    ca.date,
    ca.start_time,
    ct.name,
    up.full_name
FROM class_assignments ca
INNER JOIN class_types ct ON ca.class_type_id = ct.id
INNER JOIN user_profiles up ON ca.instructor_id = up.user_id
WHERE ca.date BETWEEN $1 AND $2
ORDER BY ca.date, ca.start_time
LIMIT 50;

-- 3. Use query hints for complex queries
/*+ IndexScan(ca idx_assignments_date_instructor) */
SELECT * FROM class_assignments ca WHERE ...;
```

#### Conflict Detection Failures
**Symptoms**: Overlapping assignments created, instructor double-booking
**Causes**: Race conditions, missing validation, database constraint issues
**Solutions**:
```sql
-- 1. Add database constraints
ALTER TABLE class_assignments 
ADD CONSTRAINT no_instructor_overlap 
EXCLUDE USING GIST (
    instructor_id WITH =,
    date WITH =,
    tsrange(
        (date + start_time)::timestamp,
        (date + end_time)::timestamp
    ) WITH &&
) WHERE (class_status != 'cancelled');

-- 2. Implement optimistic locking
ALTER TABLE class_assignments ADD COLUMN version INTEGER DEFAULT 1;

CREATE OR REPLACE FUNCTION update_assignment_version()
RETURNS TRIGGER AS $$
BEGIN
    NEW.version = OLD.version + 1;
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER assignment_version_trigger
    BEFORE UPDATE ON class_assignments
    FOR EACH ROW EXECUTE FUNCTION update_assignment_version();
```

#### Payment Calculation Errors
**Symptoms**: Incorrect payment amounts, calculation mismatches
**Causes**: Wrong payment type selection, booking count errors, race conditions
**Solutions**:
```typescript
// 1. Add comprehensive validation
const validatePaymentCalculation = (formData: FormData, studentCount: number) => {
    const errors: string[] = []
    
    if (formData.payment_amount <= 0) {
        errors.push('Payment amount must be greater than zero')
    }
    
    if (studentCount <= 0) {
        errors.push('Student count must be greater than zero')
    }
    
    if (formData.payment_type === 'per_student_per_class' && studentCount === 0) {
        errors.push('Cannot use per-student pricing with zero students')
    }
    
    return errors
}

// 2. Implement calculation audit trail
const auditPaymentCalculation = (
    originalAmount: number,
    calculatedAmount: number,
    calculationMethod: string,
    metadata: any
) => {
    const auditLog = {
        timestamp: new Date().toISOString(),
        original_amount: originalAmount,
        calculated_amount: calculatedAmount,
        calculation_method: calculationMethod,
        metadata,
        difference: Math.abs(calculatedAmount - originalAmount)
    }
    
    // Log significant differences
    if (auditLog.difference > 0.01) {
        console.warn('Payment calculation discrepancy:', auditLog)
        MonitoringService.trackError(
            new Error('Payment calculation discrepancy'),
            auditLog
        )
    }
    
    return auditLog
}
```

### Performance Troubleshooting

#### Memory Leak Detection
```typescript
// utils/memoryProfiler.ts
class MemoryProfiler {
    private static snapshots: any[] = []
    
    static takeSnapshot(label: string) {
        if ('memory' in performance) {
            const memory = (performance as any).memory
            const snapshot = {
                label,
                timestamp: Date.now(),
                usedJSHeapSize: memory.usedJSHeapSize,
                totalJSHeapSize: memory.totalJSHeapSize,
                jsHeapSizeLimit: memory.jsHeapSizeLimit
            }
            
            this.snapshots.push(snapshot)
            
            // Keep only last 10 snapshots
            if (this.snapshots.length > 10) {
                this.snapshots.shift()
            }
            
            console.log('Memory Snapshot:', snapshot)
            return snapshot
        }
        
        return null
    }
    
    static analyzeMemoryTrend() {
        if (this.snapshots.length < 2) return null
        
        const recent = this.snapshots.slice(-5)
        const growth = recent[recent.length - 1].usedJSHeapSize - recent[0].usedJSHeapSize
        const timeSpan = recent[recent.length - 1].timestamp - recent[0].timestamp
        
        const growthRate = growth / timeSpan * 1000 * 60 // MB per minute
        
        if (growthRate > 1) { // More than 1MB/minute growth
            console.warn('Potential memory leak detected:', {
                growthRate: `${growthRate.toFixed(2)} MB/minute`,
                totalGrowth: `${(growth / 1024 / 1024).toFixed(2)} MB`,
                timeSpan: `${(timeSpan / 1000).toFixed(2)} seconds`
            })
        }
        
        return { growthRate, totalGrowth: growth, timeSpan }
    }
}

// Use in components
useEffect(() => {
    MemoryProfiler.takeSnapshot('ClassAssignmentManager mounted')
    
    return () => {
        MemoryProfiler.takeSnapshot('ClassAssignmentManager unmounted')
        MemoryProfiler.analyzeMemoryTrend()
    }
}, [])
```

### Error Recovery Strategies

#### Automatic Error Recovery
```typescript
// utils/errorRecovery.ts
class ErrorRecoveryService {
    private static retryAttempts = new Map<string, number>()
    
    static async withRetry<T>(
        operation: () => Promise<T>,
        operationId: string,
        maxRetries: number = 3
    ): Promise<T> {
        const attempts = this.retryAttempts.get(operationId) || 0
        
        try {
            const result = await operation()
            this.retryAttempts.delete(operationId) // Reset on success
            return result
        } catch (error) {
            if (attempts < maxRetries) {
                this.retryAttempts.set(operationId, attempts + 1)
                
                const delay = Math.pow(2, attempts) * 1000 // Exponential backoff
                await new Promise(resolve => setTimeout(resolve, delay))
                
                console.log(`Retrying operation ${operationId}, attempt ${attempts + 1}`)
                return this.withRetry(operation, operationId, maxRetries)
            } else {
                this.retryAttempts.delete(operationId)
                throw error
            }
        }
    }
    
    static async recoverFromDatabaseError(error: any, context: string) {
        console.error(`Database error in ${context}:`, error)
        
        // Try to reconnect
        if (error.code === 'PGRST301') {
            console.log('Attempting to reconnect to database...')
            // Implement reconnection logic
            return true
        }
        
        // Check if it's a temporary network issue
        if (error.message?.includes('network')) {
            console.log('Network error detected, will retry...')
            return true
        }
        
        return false
    }
}

// Usage in data fetching
const fetchAssignments = async () => {
    return ErrorRecoveryService.withRetry(
        async () => {
            const { data, error } = await supabase
                .from('class_assignments')
                .select('*')
            
            if (error) throw error
            return data
        },
        'fetch-assignments'
    )
}
```

---

## Conclusion

This technical guide provides comprehensive coverage of the Class Assignment Manager's architecture, implementation, and operational aspects. It serves as a complete reference for developers, system administrators, and technical staff responsible for maintaining and extending the system.

The system is designed with scalability, security, and maintainability in mind, incorporating modern best practices for React applications, PostgreSQL databases, and cloud deployments.

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Compatible System Version**: ClassAssignmentManager v2.0+