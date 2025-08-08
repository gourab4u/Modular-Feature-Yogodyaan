# Class Assignment Manager - Complete User Guide

## Table of Contents
1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Assignment Types](#assignment-types)
4. [Creating Assignments](#creating-assignments)
5. [Managing Assignments](#managing-assignments)
6. [View Modes](#view-modes)
7. [Filtering and Search](#filtering-and-search)
8. [Editing Assignments](#editing-assignments)
9. [Payment Management](#payment-management)
10. [Analytics and Reporting](#analytics-and-reporting)
11. [Troubleshooting](#troubleshooting)
12. [Technical Reference](#technical-reference)

---

## Overview

The Class Assignment Manager is a comprehensive module for managing yoga class assignments, bookings, and schedules. It provides tools for creating, scheduling, editing, and tracking classes across different formats and booking types.

### Key Features
- 📅 **Multiple Assignment Types**: Adhoc, Weekly, Monthly, Crash Courses, and Packages
- 🎯 **Flexible Booking System**: Individual, Corporate, Private Group, and Public Group bookings
- 💰 **Advanced Payment Options**: Multiple payment models with automatic calculations
- 📊 **Multiple View Modes**: List, Calendar, and Analytics views
- 🔍 **Advanced Filtering**: Multi-dimensional filtering and search capabilities
- ⚠️ **Conflict Detection**: Real-time schedule conflict checking
- 📝 **Bulk Operations**: Multi-select editing and management

---

## Getting Started

### Accessing the Module
Navigate to **Dashboard → Class Assignment Manager** to access the module.

### Initial Setup
Before creating assignments, ensure you have:
- ✅ **Class Types** configured
- ✅ **Packages** set up (for package-based assignments)
- ✅ **Instructor Profiles** created
- ✅ **Bookings** available (if linking to existing bookings)

### Interface Overview
The main interface consists of:
- **Header Bar**: View toggles, filters, search, and create button
- **Main Content Area**: Dynamic based on selected view mode
- **Action Buttons**: Create, edit, delete, and bulk operations

---

## Assignment Types

### 1. Adhoc Assignments
**Best for**: One-time classes, special sessions, makeup classes

**Features**:
- Single date and time selection
- Immediate scheduling
- Direct class type selection
- Supports all booking types

**Booking Restrictions**:
- Individual bookings: 1 booking maximum
- Private group bookings: 1 booking maximum
- Corporate/Public group: Multiple bookings allowed

### 2. Weekly Assignments
**Best for**: Regular recurring classes, ongoing programs

**Features**:
- Uses existing schedule templates OR creates new ones
- Automatic recurring schedule generation
- Supports weekly payment models
- Ideal for public group classes

**Configuration Options**:
- **Template-based**: Select from existing weekly schedule templates
- **Custom Schedule**: Create new weekly recurring pattern

### 3. Monthly Assignments
**Best for**: Package-based classes with monthly duration

**Features**:
- Package selection required
- Two scheduling methods: Weekly recurrence or Manual calendar
- Automatic class distribution based on package class count
- Validity period support

**Scheduling Methods**:
- **Weekly Recurrence**: Select days of week, auto-generate until class count met
- **Manual Calendar**: Pick specific dates and times for each class

### 4. Crash Course Assignments
**Best for**: Intensive short-term courses, workshops

**Features**:
- Crash course package selection
- Accelerated scheduling (daily/multiple weekly sessions)
- Fixed duration programs
- Supports all booking types except individual

### 5. Package Assignments
**Best for**: Custom package implementations, flexible course structures

**Features**:
- Regular package selection
- Same scheduling options as monthly assignments
- Flexible duration and class count
- Customizable validity periods

---

## Creating Assignments

### Step-by-Step Process

#### 1. Open Assignment Form
- Click **+ Create Assignment** button
- Assignment form modal opens

#### 2. Select Assignment Type
Choose from five assignment types using radio buttons:
- Adhoc (single class)
- Weekly (recurring weekly)
- Monthly (package-based monthly)
- Crash Course (intensive course)
- Package (custom package)

#### 3. Configure Basic Details

**For All Assignment Types**:
- **Instructor**: Select from available instructors
- **Date**: Start date for the assignment
- **Start Time**: Class start time
- **End Time**: Class end time
- **Booking Type**: Individual, Corporate, Private Group, or Public Group

**Type-Specific Configurations**:

**Adhoc**:
- **Class Type**: Select specific class type
- **Single Date**: Specific class date

**Weekly**:
- **Template Selection**: Choose existing template or create new
- **Day of Week**: For new schedules
- **Duration**: Course duration in weeks

**Monthly/Package/Crash Course**:
- **Package Selection**: Choose appropriate package
- **Total Classes**: Number of classes in package
- **Assignment Method**: Weekly recurrence or manual calendar
- **Weekly Days**: Days of week for recurrence (if applicable)
- **Validity Period**: Package validity duration

#### 4. Configure Bookings

**Booking Assignment**:
- **No Booking**: Create assignment without linking to existing bookings
- **Single Booking**: Link to one existing booking (for individual/private group)
- **Multiple Bookings**: Link to multiple bookings (for corporate/public group)

**Booking Selection Features**:
- Status filtering (shows pending/confirmed bookings only)
- Course type matching (for package assignments)
- Real-time booking validation

#### 5. Payment Configuration

**Payment Type Options**:
- **Per Class**: Fixed amount per individual class
- **Monthly**: Fixed monthly rate (weekly classes only)
- **Per Member**: Monthly amount per student (weekly classes)
- **Total Duration**: Total amount for entire course
- **Per Class Total**: Total amount for all students per class
- **Per Student Per Class**: Amount per student per class

**Payment Amount**:
- Enter base payment amount
- System automatically calculates total based on:
  - Payment type
  - Number of students (from linked bookings)
  - Total classes
  - Assignment duration

#### 6. Conflict Checking and Validation

**Real-time Validation**:
- **Instructor Conflicts**: Checks against existing assignments and weekly schedules
- **Time Validation**: Ensures logical start/end times
- **Duration Checks**: Warns about very short or very long classes
- **Business Hour Warnings**: Alerts for early morning or late evening classes

**Conflict Types**:
- ⚠️ **Warning**: Minor conflicts or recommendations
- ❌ **Error**: Major conflicts that prevent assignment creation

#### 7. Review and Submit

**Pre-submission Checklist**:
- Review all assignment details
- Check payment calculations
- Verify instructor availability
- Confirm booking associations

**Submission Process**:
- Click **Save Assignment**
- System validates all data
- Creates assignment record(s)
- Updates linked booking statuses
- Returns to main view with confirmation

---

## Managing Assignments

### Assignment Status Management

**Class Status Options**:
- **Scheduled**: Class is planned and confirmed
- **Completed**: Class has been conducted
- **Cancelled**: Class has been cancelled

**Payment Status Options**:
- **Pending**: Payment not yet received
- **Paid**: Payment completed
- **Cancelled**: Payment cancelled

**Instructor Status Options**:
- **Pending**: Instructor not yet responded
- **Accepted**: Instructor confirmed availability
- **Rejected**: Instructor declined assignment

### Bulk Operations

#### Enabling Multi-Select Mode
1. Click the **Select** button in the header
2. Interface switches to selection mode
3. Checkboxes appear next to each assignment

#### Selection Options
- **Individual Selection**: Click checkbox next to specific assignments
- **Select All**: Click header checkbox to select all visible assignments
- **Clear All**: Click to deselect all assignments

#### Bulk Actions
- **Bulk Delete**: Delete multiple assignments simultaneously
- **Bulk Status Update**: Update status for multiple assignments

### Assignment Grouping

**List View Grouping**:
- Assignments grouped by type and pattern
- Collapsible group headers
- Group metadata display:
  - Total classes in group
  - Total revenue
  - Date range
  - Instructor information

**Group Actions**:
- **Expand/Collapse**: Show/hide assignments in group
- **Group Edit**: Edit properties that apply to all assignments in group
- **Group Delete**: Delete entire group of assignments

---

## View Modes

### List View
**Best for**: Detailed assignment management, bulk operations

**Features**:
- **Grouped Display**: Assignments organized by type and pattern
- **Detailed Information**: Full assignment details in each row
- **Status Indicators**: Visual badges for all status types
- **Multi-Select Support**: Bulk operation capabilities
- **Sorting Options**: Sort by date, instructor, status, etc.

**Information Displayed**:
- Class type/package name
- Date and time
- Instructor name
- Payment amount and status
- Booking information
- Status indicators

### Calendar View
**Best for**: Visual schedule management, conflict identification

**Features**:
- **Weekly Grid**: 24-hour weekly calendar display
- **Assignment Blocks**: Visual time blocks for each assignment
- **Color Coding**: Different colors for different statuses
- **Conflict Visualization**: Overlapping assignments clearly visible
- **Interactive Navigation**: Week-by-week navigation

**Navigation Options**:
- **Previous/Next Week**: Arrow buttons for week navigation
- **Today Button**: Quick return to current week
- **Date Display**: Shows current week date range

**Visual Elements**:
- **Assignment Blocks**: Sized and positioned by time
- **Instructor Names**: Displayed within assignment blocks
- **Status Colors**:
  - Green: Instructor accepted
  - Yellow: Instructor pending
  - Red: Instructor rejected or cancelled
  - Gray: Completed classes

### Analytics View
**Best for**: Performance analysis, revenue tracking, reporting

**Key Metrics**:
- **Total Revenue**: Overall revenue from all assignments
- **Revenue by Type**: Breakdown by assignment type
- **Assignment Distribution**: Pie chart of assignment types
- **Payment Status**: Paid vs. pending breakdown
- **Monthly Trends**: 6-month revenue trend

**Instructor Analytics**:
- **Instructor Performance**: Classes assigned, completion rates
- **Revenue per Instructor**: Individual instructor revenue
- **Workload Distribution**: Class distribution across instructors

**Time-based Analytics**:
- **Monthly Revenue Trends**: Line graph showing 6-month trends
- **Weekly Distribution**: Classes per day of week
- **Time Distribution**: Popular class times

---

## Filtering and Search

### Advanced Filters

#### Access Filters
- Click **Filter** button in header
- Filter panel slides out from right side
- Multiple filter categories available

#### Filter Categories

**Date Range**:
- **Start Date**: Filter assignments from specific date
- **End Date**: Filter assignments until specific date
- **Quick Options**: Today, This Week, This Month, etc.

**Assignment Types**:
- Multi-select checkbox list
- Filter by: Adhoc, Weekly, Monthly, Crash Course, Package

**Status Filters**:
- **Class Status**: Scheduled, Completed, Cancelled
- **Payment Status**: Pending, Paid, Cancelled
- **Instructor Status**: Pending, Accepted, Rejected

**Resource Filters**:
- **Instructors**: Multi-select instructor list
- **Class Types**: Multi-select class type list
- **Packages**: Multi-select package list

**Special Filters**:
- **Client Name**: Text search in booking client names
- **Weekly Classes Only**: Show only recurring weekly classes
- **Show Conflicts Only**: Display only assignments with conflicts

#### Filter Management
- **Active Filter Count**: Shows number of active filters
- **Clear All Filters**: Reset all filters to default
- **Filter Persistence**: Filters remain active while navigating

### Search Functionality

**Search Bar**:
- Located in main header
- Real-time search as you type
- Searches across multiple fields:
  - Instructor names
  - Class type names
  - Package names
  - Booking client names
  - Assignment notes

**Search Tips**:
- Partial matches supported
- Case-insensitive search
- Combine with filters for refined results

---

## Editing Assignments

### Opening Edit Modal

**Access Methods**:
- **List View**: Click assignment row or "Edit" button
- **Calendar View**: Click assignment block
- **Class Details Popup**: Click "Edit Assignment" button

### Edit Modal Features

#### Assignment Overview
- **Read-only Information**: Class type, date/time, instructor
- **Booking Status**: Shows current booking associations
- **Invalid Booking Warning**: Alerts if linked bookings no longer exist

#### Editable Fields

**Status Management**:
- **Class Status**: Change between Scheduled, Completed, Cancelled
- **Payment Status**: Update payment status
- **Cancellation Warnings**: Shows impact of cancelling classes

**Payment Information**:
- **Payment Amount**: Update payment amount (recalculates based on bookings)
- **Notes**: Add or edit assignment notes

**Booking Management**:
- **Add Bookings**: Link additional bookings to assignment
- **Remove Bookings**: Unlink existing bookings
- **Booking Validation**: Ensures valid booking references

#### Special Edit Features

**Weekly Recurring Class Updates**:
- For individual booking type with weekly recurrence:
- **Weekly Days Selection**: Choose days of week to update
- **Bulk Update**: Updates all future classes in the series with new booking IDs
- **Smart Filtering**: Only updates classes on selected weekdays

**Payment Recalculation**:
- Automatic recalculation based on:
  - Number of linked bookings
  - Payment type
  - Student count
- Real-time payment summary display

#### Saving Changes

**Validation Process**:
- Checks for valid booking references
- Validates payment amounts
- Confirms instructor availability (for time changes)

**Update Process**:
- Updates assignment record
- Updates booking associations in junction table
- Refreshes booking statuses
- Updates related assignments (for recurring classes)

### Class Details Popup

**Information Display**:
- Complete assignment information
- Instructor contact details
- Booking details and client information
- Payment history and status
- Assignment notes and history

**Available Actions**:
- Edit Assignment
- Cancel Class
- Mark as Completed
- Update Payment Status
- View Booking Details

---

## Payment Management

### Payment Types Explained

#### Per Class
- **Definition**: Fixed amount per individual class session
- **Use Case**: Standard adhoc classes, simple pricing
- **Calculation**: Amount entered = amount charged per class
- **Example**: ₹500 per class

#### Monthly (Weekly Classes Only)
- **Definition**: Fixed monthly subscription rate
- **Use Case**: Regular weekly subscribers
- **Calculation**: Monthly amount ÷ average classes per month
- **Example**: ₹2000/month ÷ 4 classes = ₹500 per class

#### Per Member (Weekly Classes Only)
- **Definition**: Monthly amount per student
- **Use Case**: Group classes with per-student pricing
- **Calculation**: (Monthly rate × students) ÷ classes per month
- **Example**: (₹1500 × 3 students) ÷ 4 classes = ₹1125 per class

#### Total Duration
- **Definition**: Total amount for entire course duration
- **Use Case**: Package courses, crash courses
- **Calculation**: Total amount ÷ total classes in course
- **Example**: ₹5000 total ÷ 10 classes = ₹500 per class

#### Per Class Total
- **Definition**: Total amount for all students per class
- **Use Case**: Group classes with fixed group rate
- **Calculation**: Amount entered = total for entire class
- **Example**: ₹1500 per class (regardless of student count)

#### Per Student Per Class
- **Definition**: Amount per student per class
- **Use Case**: Group classes with per-student rates
- **Calculation**: Amount per student × number of students
- **Example**: ₹500 × 3 students = ₹1500 per class

### Payment Calculation System

**Automatic Calculation**:
- System calculates final payment based on:
  - Selected payment type
  - Number of linked bookings (student count)
  - Total classes in assignment
  - Assignment duration

**Real-time Updates**:
- Payment amount updates automatically when:
  - Bookings are added or removed
  - Payment type is changed
  - Student count changes

**Payment Summary Display**:
- Shows total amount per class
- Displays student count
- Calculates total revenue for assignment

### Payment Status Management

**Status Tracking**:
- **Pending**: Payment not yet received
- **Paid**: Payment completed and verified
- **Cancelled**: Payment cancelled or refunded

**Status Updates**:
- Update payment status in edit modal
- Bulk status updates for multiple assignments
- Automatic status updates from payment integrations

---

## Analytics and Reporting

### Revenue Analytics

**Total Revenue Metrics**:
- **Overall Revenue**: Total revenue from all assignments
- **Revenue by Assignment Type**: Breakdown showing revenue by type
- **Monthly Revenue**: Current month revenue with comparison
- **Growth Metrics**: Month-over-month growth percentages

**Revenue Trends**:
- **6-Month Trend**: Line graph showing revenue trends
- **Peak Performance**: Identification of best-performing periods
- **Seasonal Analysis**: Revenue patterns across months

### Assignment Analytics

**Assignment Distribution**:
- **Pie Chart**: Visual breakdown of assignment types
- **Type Comparison**: Percentage of total assignments by type
- **Growth by Type**: Which assignment types are growing

**Class Metrics**:
- **Total Classes**: Overall class count
- **Completion Rate**: Percentage of completed vs. scheduled classes
- **Cancellation Rate**: Percentage of cancelled classes
- **Average Class Value**: Revenue per class across all types

### Instructor Analytics

**Performance Metrics**:
- **Classes Assigned**: Total classes per instructor
- **Completion Rate**: Instructor-specific completion rates
- **Revenue Generated**: Total revenue per instructor
- **Response Rate**: How quickly instructors accept assignments

**Workload Distribution**:
- **Classes per Instructor**: Distribution of workload
- **Availability Patterns**: When instructors are most available
- **Specialization Analysis**: Which instructors handle which class types

### Payment Analytics

**Payment Status Breakdown**:
- **Paid Assignments**: Percentage and amount of paid assignments
- **Pending Payments**: Outstanding payment amounts
- **Payment Timing**: Average time from assignment to payment
- **Payment Method Analysis**: If integrated with payment systems

**Financial Health Metrics**:
- **Collection Rate**: Percentage of payments collected
- **Average Payment Value**: Mean payment per assignment
- **Revenue Concentration**: Revenue distribution across booking types

### Usage Patterns

**Time-based Analysis**:
- **Popular Time Slots**: Most booked class times
- **Day of Week Patterns**: Which days are most popular
- **Seasonal Trends**: How usage varies across months

**Booking Type Analysis**:
- **Individual vs Group**: Breakdown of booking types
- **Corporate Bookings**: Corporate vs individual analysis
- **Package Popularity**: Which packages are most popular

### Exporting Reports

**Export Options**:
- **PDF Reports**: Formatted reports for sharing
- **Excel/CSV Export**: Raw data for further analysis
- **Date Range Selection**: Custom reporting periods
- **Filter-based Exports**: Export filtered data sets

---

## Troubleshooting

### Common Issues and Solutions

#### Assignment Creation Issues

**Problem**: "Instructor conflict detected"
- **Cause**: Instructor already has assignment at same time
- **Solution**: 
  - Choose different time slot
  - Select different instructor
  - Check instructor's weekly schedule for conflicts

**Problem**: "Invalid booking ID"
- **Cause**: Selected booking no longer exists or is invalid
- **Solution**:
  - Refresh page to reload current bookings
  - Select different booking
  - Create assignment without booking link

**Problem**: "Package not found"
- **Cause**: Selected package has been deleted or deactivated
- **Solution**:
  - Refresh page to reload packages
  - Select different active package
  - Contact admin to reactivate package

#### Payment Calculation Issues

**Problem**: Payment amount shows as ₹0
- **Cause**: Missing payment type or invalid configuration
- **Solution**:
  - Ensure payment type is selected
  - Enter valid payment amount
  - Check student count calculation

**Problem**: Incorrect payment calculation
- **Cause**: Wrong payment type selection or booking count
- **Solution**:
  - Verify payment type matches intended billing model
  - Check number of linked bookings
  - Review student count in payment summary

#### Booking Association Issues

**Problem**: Cannot link multiple bookings
- **Cause**: Assignment type doesn't support multiple bookings
- **Solution**:
  - Check assignment type constraints
  - Individual bookings: only 1 booking allowed
  - Use corporate or group booking types for multiple

**Problem**: Booking shows as invalid in edit modal
- **Cause**: Linked booking has been deleted or status changed
- **Solution**:
  - Remove invalid booking from assignment
  - Select new valid booking
  - Update booking status if needed

#### View and Display Issues

**Problem**: Assignments not showing in list
- **Cause**: Active filters hiding assignments
- **Solution**:
  - Check active filters in filter panel
  - Clear all filters to see all assignments
  - Adjust date range filters

**Problem**: Calendar view shows overlapping assignments
- **Cause**: This is normal for conflict visualization
- **Solution**:
  - Review overlapping assignments for actual conflicts
  - Adjust assignment times if needed
  - Check instructor availability

#### Performance Issues

**Problem**: Slow loading of assignments
- **Cause**: Large dataset or network issues
- **Solution**:
  - Use date range filters to limit data
  - Check internet connection
  - Refresh page to reload data

**Problem**: Form submission takes long time
- **Cause**: Complex assignment creation with many classes
- **Solution**:
  - Wait for completion (may take up to 30 seconds for large assignments)
  - Don't refresh page during submission
  - Check for confirmation message

### Error Messages and Meanings

**Validation Errors**:
- "Class type is required": Must select class type for adhoc assignments
- "Instructor is required": Must select instructor for all assignments
- "Date is required": Must provide assignment date
- "Invalid time format": Use HH:MM format for times
- "End time must be after start time": Logical time validation

**Business Logic Errors**:
- "Package class count exceeded": Trying to create more classes than package allows
- "Booking type mismatch": Selected booking doesn't match assignment booking type
- "Instructor not available": Instructor has existing conflict at selected time

**Database Errors**:
- "Failed to create assignment": Database connection or constraint issue
- "Booking association failed": Junction table insert failed
- "Transaction rolled back": Partial creation failed, all changes reverted

### Getting Help

**When to Contact Support**:
- Persistent database errors
- Payment calculation discrepancies
- Data corruption or missing assignments
- Integration issues with external systems

**Information to Provide**:
- Exact error message
- Steps taken before error occurred
- Assignment details (type, date, instructor, etc.)
- Browser and device information
- Screenshots of issue

---

## Technical Reference

### Database Schema

#### Core Tables

**class_assignments**:
- `id`: UUID primary key
- `class_type_id`: Foreign key to class_types
- `package_id`: Foreign key to packages (nullable)
- `instructor_id`: Foreign key to user_profiles
- `date`: Class date (DATE)
- `start_time`: Class start time (TIME)
- `end_time`: Class end time (TIME)
- `payment_amount`: Payment amount (DECIMAL)
- `payment_type`: Payment calculation method (TEXT)
- `schedule_type`: Assignment type (TEXT)
- `booking_type`: Type of booking (TEXT)
- `class_status`: Class status (TEXT)
- `payment_status`: Payment status (TEXT)
- `instructor_status`: Instructor response status (TEXT)
- `notes`: Assignment notes (TEXT)
- `assigned_by`: User who created assignment (UUID)
- `assigned_at`: Creation timestamp (TIMESTAMP)

**assignment_bookings** (Junction Table):
- `id`: UUID primary key
- `assignment_id`: Foreign key to class_assignments
- `booking_id`: Booking identifier (TEXT)
- `created_at`: Creation timestamp (TIMESTAMP)

#### Related Tables

**bookings**:
- Contains all booking records
- Linked via assignment_bookings junction table
- Fields: booking_id, user_id, class_name, instructor, etc.

**class_types**:
- Available class types
- Fields: id, name, difficulty_level, etc.

**packages**:
- Available packages and courses
- Fields: id, name, class_count, validity_days, course_type, etc.

**user_profiles**:
- User information including instructors
- Fields: user_id, full_name, email, etc.

**class_schedules**:
- Weekly recurring schedule templates
- Fields: class_type_id, day_of_week, start_time, end_time, etc.

### API Endpoints

#### Assignment Operations
- `GET /class_assignments`: Fetch all assignments with filters
- `POST /class_assignments`: Create new assignment
- `PUT /class_assignments/:id`: Update existing assignment
- `DELETE /class_assignments/:id`: Delete assignment

#### Booking Operations
- `GET /bookings`: Fetch available bookings
- `POST /assignment_bookings`: Create booking associations
- `DELETE /assignment_bookings`: Remove booking associations

#### Supporting Data
- `GET /class_types`: Fetch class types
- `GET /packages`: Fetch packages
- `GET /user_profiles`: Fetch user profiles (instructors)
- `GET /class_schedules`: Fetch schedule templates

### Business Logic Constants

#### Assignment Types
- `adhoc`: Single one-time class
- `weekly`: Recurring weekly class
- `monthly`: Monthly package-based class
- `crash_course`: Crash course package
- `package`: Regular package assignment

#### Booking Types
- `individual`: Individual student booking
- `corporate`: Corporate/organization booking
- `private_group`: Private group session
- `public_group`: Open public class

#### Payment Types
- `per_class`: Fixed amount per class
- `monthly`: Monthly subscription (weekly only)
- `per_member`: Monthly per student (weekly only)
- `total_duration`: Total for entire duration
- `per_class_total`: Total per class (all students)
- `per_student_per_class`: Amount per student per class

#### Status Values
**Class Status**:
- `scheduled`: Class is scheduled
- `completed`: Class completed
- `cancelled`: Class cancelled

**Payment Status**:
- `pending`: Payment pending
- `paid`: Payment completed
- `cancelled`: Payment cancelled

**Instructor Status**:
- `pending`: Response pending
- `accepted`: Instructor accepted
- `rejected`: Instructor rejected

### Component Architecture

#### Main Components
- `ClassAssignmentManager`: Root component
- `AssignmentForm`: Assignment creation form
- `EditAssignmentModal`: Assignment editing modal
- `AssignmentListView`: List display component
- `CalendarView`: Calendar display component
- `AnalyticsView`: Analytics dashboard
- `AdvancedFilters`: Filtering interface

#### Supporting Components
- `AdaptiveBookingSelector`: Booking selection component
- `MultipleBookingSelector`: Multiple booking selection
- `ManualCalendarSelector`: Manual date selection
- `ClassDetailsPopup`: Assignment details display
- `Button`: Reusable button component
- `LoadingSpinner`: Loading indicator

#### Custom Hooks
- `useClassAssignmentData`: Data fetching and management
- `useFormHandler`: Form state and validation management

#### Services
- `AssignmentCreationService`: Business logic for creating assignments
- Payment calculation logic
- Conflict detection algorithms
- Validation utilities

### Data Flow

#### Assignment Creation Flow
1. User selects assignment type
2. Form configures available options based on type
3. User fills form with assignment details
4. System validates form data and checks conflicts
5. AssignmentCreationService processes business logic
6. Database transactions create assignment and associations
7. UI updates with new assignment data

#### Assignment Editing Flow
1. User selects assignment to edit
2. EditAssignmentModal loads current assignment data
3. User modifies editable fields
4. System recalculates dependent values (payment, etc.)
5. Validation ensures data integrity
6. Database updates assignment and associations
7. Related assignments updated if applicable (recurring classes)

#### Data Synchronization
- All components use shared data from useClassAssignmentData hook
- Data fetching happens in parallel for optimal performance
- State updates trigger re-renders only for affected components
- Real-time updates maintain data consistency across views

---

## Conclusion

The Class Assignment Manager is a comprehensive solution for managing yoga class assignments, providing flexibility for different business models while maintaining data integrity and user experience. This guide covers all major features and workflows, enabling both administrators and users to effectively utilize the system.

For additional support or advanced configurations, please refer to the technical documentation or contact system administrators.

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Compatible Module Version**: ClassAssignmentManager v2.0+