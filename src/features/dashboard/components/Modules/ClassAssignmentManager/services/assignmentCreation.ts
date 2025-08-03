import { supabase } from '../../../../../../shared/lib/supabase'
import { FormData, Package } from '../types'

// Helper function to validate UUID format
const isValidUUID = (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(uuid)
}

// Helper function to validate booking exists in database
const validateBookingExists = async (bookingId: string): Promise<boolean> => {
    if (!bookingId || bookingId.trim() === '' || bookingId.trim() === 'null' || bookingId.trim() === 'undefined') {
        return true // No booking to validate
    }
    
    if (!isValidUUID(bookingId.trim())) {
        console.warn('Invalid booking ID format:', bookingId)
        return false
    }
    
    try {
        console.log('Validating booking ID:', bookingId.trim())
        const { data: booking, error: bookingError } = await supabase
            .from('bookings')
            .select('id')
            .eq('id', bookingId.trim())
            .single()
        
        if (bookingError || !booking) {
            console.error('Booking validation failed:', {
                bookingId: bookingId.trim(),
                error: bookingError,
                data: booking
            })
            return false
        }
        
        console.log('Booking validation successful for ID:', bookingId.trim())
        return true
    } catch (error) {
        console.error('Exception during booking validation:', error)
        return false
    }
}

// Helper function to clean assignment data - removes empty UUID fields that would cause 22P02 errors
const cleanAssignmentData = async (data: any): Promise<any> => {
    const cleaned = { ...data }
    
    // List of ALL UUID fields that could be empty
    const uuidFields = ['booking_id', 'class_type_id', 'package_id', 'instructor_id', 'assigned_by']
    
    // First validate booking_id if present
    if (cleaned.booking_id && cleaned.booking_id.trim() !== '') {
        const bookingExists = await validateBookingExists(cleaned.booking_id)
        if (!bookingExists) {
            console.error('Invalid booking_id found - booking does not exist in database:', cleaned.booking_id)
            throw new Error(`Selected booking is invalid or has been deleted. Please select a different booking or remove the booking selection.`)
        }
    }
    
    uuidFields.forEach(field => {
        if (cleaned[field] === '' || cleaned[field] === null || cleaned[field] === undefined || 
            cleaned[field] === 'null' || cleaned[field] === 'undefined' || 
            (typeof cleaned[field] === 'string' && cleaned[field].trim() === '')) {
            if (field === 'class_type_id') {
                // class_type_id is only required for adhoc assignments
                // For package-based assignments, it can be null/empty
                delete cleaned[field]
            } else if (field === 'package_id') {
                // package_id is only required for package-based assignments
                // For adhoc assignments, it can be null/empty
                delete cleaned[field]
            } else if (field === 'instructor_id') {
                throw new Error('Please select an instructor before creating the assignment')
            } else if (field === 'assigned_by') {
                throw new Error('Authentication error - please log out and log in again')
            } else {
                delete cleaned[field]
            }
        }
    })
    
    console.log('Original data:', JSON.stringify(data, null, 2))
    console.log('Cleaned data:', JSON.stringify(cleaned, null, 2))
    
    return cleaned
}

// Helper function to get current user ID - requires authentication
const getCurrentUserId = async (): Promise<string> => {
    try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) {
            console.error('Auth error getting current user:', error)
            throw new Error('Authentication failed. Please log in to create assignments.')
        }
        if (!user || !user.id) {
            console.error('No authenticated user found')
            throw new Error('You must be logged in to create assignments. Please log in and try again.')
        }
        // Check if user.id is a valid UUID (not empty string)
        if (typeof user.id !== 'string' || user.id.trim() === '') {
            console.error('Invalid user ID:', user.id)
            throw new Error('Invalid authentication state. Please log out and log in again.')
        }
        console.log('Current user ID:', user.id)
        return user.id
    } catch (error) {
        if (error.message && error.message.includes('log in')) {
            throw error // Re-throw authentication errors as-is
        }
        console.error('Failed to get current user:', error)
        throw new Error('Authentication failed. Please log in to create assignments.')
    }
}

export class AssignmentCreationService {
    static async createAssignment(formData: FormData, packages: Package[], studentCount?: number) {
        switch (formData.assignment_type) {
            case 'adhoc':
                return this.createAdhocAssignment(formData, studentCount)
            case 'weekly':
                return this.createWeeklyAssignment(formData, studentCount)
            case 'monthly':
                return this.createMonthlyAssignment(formData, studentCount)
            case 'crash_course':
                return this.createCrashCourseAssignment(formData, packages, studentCount)
            case 'package':
                return this.createPackageAssignment(formData, packages, studentCount)
            default:
                throw new Error(`Unknown assignment type: ${formData.assignment_type}`)
        }
    }

    private static async createAdhocAssignment(formData: FormData, studentCount?: number) {
        const currentUserId = await getCurrentUserId()
        
        // Validate required fields
        if (!formData.class_type_id || formData.class_type_id.trim() === '') {
            throw new Error('Class type is required')
        }
        if (!formData.instructor_id || formData.instructor_id.trim() === '') {
            throw new Error('Instructor is required')
        }

        // Validate UUID formats  
        if (!isValidUUID(formData.class_type_id.trim())) {
            throw new Error('Invalid class type ID format')
        }
        if (!isValidUUID(formData.instructor_id.trim())) {
            throw new Error('Invalid instructor ID format')
        }
        if (!isValidUUID(currentUserId.trim())) {
            throw new Error('Invalid user authentication - please log out and log in again')
        }
        // Booking validation is now handled in cleanAssignmentData function
        if (!formData.date || formData.date.trim() === '') {
            throw new Error('Date is required')
        }
        if (!formData.start_time || formData.start_time.trim() === '') {
            throw new Error('Start time is required')
        }
        if (!formData.end_time || formData.end_time.trim() === '') {
            throw new Error('End time is required')
        }

        // Validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/
        if (!dateRegex.test(formData.date)) {
            throw new Error('Date must be in YYYY-MM-DD format')
        }

        // Validate time format (HH:MM or HH:MM:SS)
        const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/
        if (!timeRegex.test(formData.start_time)) {
            throw new Error('Start time must be in HH:MM format')
        }
        if (!timeRegex.test(formData.end_time)) {
            throw new Error('End time must be in HH:MM format')
        }

        // Validate payment amount is a valid number
        if (isNaN(formData.payment_amount) || formData.payment_amount < 0) {
            throw new Error('Payment amount must be a valid positive number')
        }
        
        // Calculate payment amount using centralized logic
        const paymentAmount = this.calculatePaymentAmount(formData, 'adhoc', 1, studentCount)
        
        // Create assignment data with required fields only, add others conditionally
        const assignmentData: any = {
            class_type_id: formData.class_type_id.trim(),
            date: formData.date.trim(),
            start_time: formData.start_time.trim(),
            end_time: formData.end_time.trim(),
            instructor_id: formData.instructor_id.trim(),
            payment_amount: paymentAmount,
            schedule_type: 'adhoc',
            assigned_by: currentUserId.trim(),
            booking_type: formData.booking_type || 'individual'
        }

        // Add optional fields only if they have valid non-empty values
        if (formData.notes && formData.notes.trim() !== '') {
            assignmentData.notes = formData.notes.trim()
        }
        if (formData.booking_id && formData.booking_id.trim() !== '' && formData.booking_id.trim() !== 'null' && formData.booking_id.trim() !== 'undefined') {
            assignmentData.booking_id = formData.booking_id.trim()
        }
        if (formData.client_name && formData.client_name.trim() !== '') {
            assignmentData.client_name = formData.client_name.trim()
        }
        if (formData.client_email && formData.client_email.trim() !== '') {
            assignmentData.client_email = formData.client_email.trim()
        }
        
        // Set default status fields that might be required
        assignmentData.class_status = 'scheduled'
        assignmentData.payment_status = 'pending'
        assignmentData.instructor_status = 'pending'

        // Clean the assignment data to remove empty UUID fields
        const cleanedAssignmentData = await cleanAssignmentData(assignmentData)

        console.log('Assignment data being inserted:', JSON.stringify(cleanedAssignmentData, null, 2))
        console.log('Current user ID was:', currentUserId)

        const { error } = await supabase
            .from('class_assignments')
            .insert([cleanedAssignmentData])

        if (error) {
            console.error('Supabase insert error:', {
                error,
                code: error.code,
                message: error.message,
                details: error.details,
                hint: error.hint,
                assignmentData
            })
            throw new Error(`Database error: ${error.message || 'Unknown error occurred while creating assignment'}`)
        }

        // Update booking status if linked
        if (formData.booking_id) {
            await this.updateBookingStatus(formData.booking_id, 'completed')
        }

        return { success: true, count: 1 }
    }

    private static async createWeeklyAssignment(formData: FormData, studentCount?: number) {
        if (formData.monthly_assignment_method === 'weekly_recurrence' && formData.selected_template_id) {
            return this.createWeeklyFromTemplate(formData, studentCount)
        } else {
            return this.createNewWeeklySchedule(formData, studentCount)
        }
    }

    private static async createWeeklyFromTemplate(formData: FormData, studentCount?: number) {
        // Get template details
        const { data: template, error: templateError } = await supabase
            .from('class_schedules')
            .select('*')
            .eq('id', formData.selected_template_id)
            .single()

        if (templateError) throw templateError

        // Update the template with the assigned instructor
        const { error: updateError } = await supabase
            .from('class_schedules')
            .update({
                instructor_id: formData.instructor_id,
                notes: formData.notes
            })
            .eq('id', formData.selected_template_id)

        if (updateError) throw updateError

        // Create weekly assignments based on the template
        const assignments = await this.generateWeeklyAssignments(
            formData,
            template.day_of_week,
            template.start_time,
            template.end_time,
            template.class_type_id,
            studentCount
        )

        const cleanedAssignments = await Promise.all(assignments.map(cleanAssignmentData))
        const { error: insertError } = await supabase
            .from('class_assignments')
            .insert(cleanedAssignments)

        if (insertError) throw insertError

        // Update booking status if linked
        if (formData.booking_id) {
            await this.updateBookingStatus(formData.booking_id, 'completed')
        }

        return { success: true, count: assignments.length }
    }

    private static async createNewWeeklySchedule(formData: FormData, studentCount?: number) {
        // Create new weekly schedule template
        const scheduleData = {
            class_type_id: formData.class_type_id,
            day_of_week: formData.day_of_week,
            start_time: formData.start_time,
            end_time: formData.end_time,
            instructor_id: formData.instructor_id,
            duration_minutes: formData.duration,
            max_participants: 10, // Default value
            is_active: true,
            notes: formData.notes
        }

        const { error: scheduleError } = await supabase
            .from('class_schedules')
            .insert([scheduleData])

        if (scheduleError) throw scheduleError

        // Generate weekly assignments
        const assignments = await this.generateWeeklyAssignments(
            formData,
            formData.day_of_week,
            formData.start_time,
            formData.end_time,
            formData.class_type_id,
            studentCount
        )

        const cleanedAssignments = await Promise.all(assignments.map(cleanAssignmentData))
        const { error: assignmentError } = await supabase
            .from('class_assignments')
            .insert(cleanedAssignments)

        if (assignmentError) throw assignmentError

        // Update booking status if linked
        if (formData.booking_id) {
            await this.updateBookingStatus(formData.booking_id, 'completed')
        }

        return { success: true, count: assignments.length }
    }

    private static async generateWeeklyAssignments(
        formData: FormData,
        dayOfWeek: number,
        startTime: string,
        endTime: string,
        classTypeId: string,
        studentCount?: number
    ) {
        const currentUserId = await getCurrentUserId()
        const assignments = []
        const startDate = new Date(formData.start_date)
        
        // Use end_date if provided, otherwise default to end of current year
        const endDate = formData.end_date 
            ? new Date(formData.end_date) 
            : new Date(`${new Date().getFullYear()}-12-31`)

        // Find the first occurrence of the specified day
        const currentDate = new Date(startDate)
        while (currentDate.getDay() !== dayOfWeek) {
            currentDate.setDate(currentDate.getDate() + 1)
        }

        // Create assignments for each occurrence until end date
        while (currentDate <= endDate) {
            const assignment: any = {
                class_type_id: classTypeId,
                date: currentDate.toISOString().split('T')[0],
                start_time: startTime,
                end_time: endTime,
                instructor_id: formData.instructor_id,
                payment_amount: this.calculatePaymentAmount(formData, 'weekly', undefined, studentCount),
                schedule_type: 'weekly',
                assigned_by: currentUserId,
                booking_type: formData.booking_type || 'public_group',
                class_status: 'scheduled',
                payment_status: 'pending',
                instructor_status: 'pending'
            }

            // Add optional fields only if they have values
            if (formData.notes) assignment.notes = formData.notes
            if (formData.booking_id && formData.booking_id.trim() !== '' && formData.booking_id.trim() !== 'null' && formData.booking_id.trim() !== 'undefined') {
                assignment.booking_id = formData.booking_id.trim()
            }
            if (formData.client_name) assignment.client_name = formData.client_name
            if (formData.client_email) assignment.client_email = formData.client_email

            assignments.push(assignment)

            // Move to next week
            currentDate.setDate(currentDate.getDate() + 7)
        }

        return assignments
    }

    private static async createMonthlyAssignment(formData: FormData, studentCount?: number) {
        const assignments = []
        let perClassAmount: number

        // Calculate per-class amount based on payment type
        perClassAmount = this.calculatePaymentAmount(formData, 'monthly', undefined, studentCount)

        if (formData.monthly_assignment_method === 'weekly_recurrence') {
            assignments.push(...await this.generateWeeklyRecurrenceAssignments(formData, perClassAmount))
        } else {
            assignments.push(...await this.generateManualCalendarAssignments(formData, perClassAmount))
        }

        const cleanedAssignments = await Promise.all(assignments.map(cleanAssignmentData))
        const { error } = await supabase
            .from('class_assignments')
            .insert(cleanedAssignments)

        if (error) throw error

        // Update booking status if linked
        if (formData.booking_id) {
            await this.updateBookingStatus(formData.booking_id, 'completed')
        }

        return { success: true, count: assignments.length }
    }

    private static async generateWeeklyRecurrenceAssignments(formData: FormData, perClassAmount: number) {
        const currentUserId = await getCurrentUserId()
        const assignments = []

        // Validate weekly days selection
        if (!formData.weekly_days || formData.weekly_days.length === 0) {
            throw new Error('Please select at least one day of the week')
        }

        // Continue creating assignments until we hit the class count or end date
        const currentDate = new Date(formData.start_date)
        let classesCreated = 0

        while (classesCreated < formData.total_classes) {
            // Check if current day is in selected weekdays
            const currentDayOfWeek = currentDate.getDay() // 0 = Sunday, 6 = Saturday

            if (formData.weekly_days.includes(currentDayOfWeek)) {
                const assignment: any = {
                    package_id: formData.package_id,
                    date: currentDate.toISOString().split('T')[0],
                    start_time: formData.start_time,
                    end_time: formData.end_time,
                    instructor_id: formData.instructor_id,
                    payment_amount: perClassAmount,
                    schedule_type: 'monthly',
                    assigned_by: currentUserId,
                    booking_type: formData.booking_type || 'individual',
                    class_status: 'scheduled',
                    payment_status: 'pending',
                    instructor_status: 'pending'
                }

                // Add optional fields only if they have values
                if (formData.notes) assignment.notes = formData.notes
                if (formData.booking_id && formData.booking_id.trim() !== '' && formData.booking_id.trim() !== 'null' && formData.booking_id.trim() !== 'undefined') {
                    assignment.booking_id = formData.booking_id.trim()
                }
                if (formData.client_name) assignment.client_name = formData.client_name
                if (formData.client_email) assignment.client_email = formData.client_email

                assignments.push(assignment)
                classesCreated++

                // Break if we've reached the required class count
                if (classesCreated >= formData.total_classes) {
                    break
                }
            }

            // Move to next day
            currentDate.setDate(currentDate.getDate() + 1)
        }

        return assignments
    }

    private static async generateManualCalendarAssignments(formData: FormData, perClassAmount: number) {
        const currentUserId = await getCurrentUserId()
        
        // Validate manual selections
        if (!formData.manual_selections || formData.manual_selections.length === 0) {
            throw new Error('Please select at least one class date and time')
        }

        // Create assignments from manual selections
        return formData.manual_selections.map(selection => {
            const assignment: any = {
                package_id: formData.package_id,
                date: selection.date,
                start_time: selection.start_time,
                end_time: selection.end_time,
                instructor_id: formData.instructor_id,
                payment_amount: perClassAmount,
                schedule_type: 'monthly',
                assigned_by: currentUserId,
                booking_type: formData.booking_type || 'individual',
                class_status: 'scheduled',
                payment_status: 'pending',
                instructor_status: 'pending'
            }

            // Add optional fields only if they have values
            if (formData.notes) assignment.notes = formData.notes
            if (formData.booking_id && formData.booking_id.trim() !== '' && formData.booking_id.trim() !== 'null' && formData.booking_id.trim() !== 'undefined') {
                assignment.booking_id = formData.booking_id.trim()
            }
            if (formData.client_name) assignment.client_name = formData.client_name
            if (formData.client_email) assignment.client_email = formData.client_email

            return assignment
        })
    }

    private static async createCrashCourseAssignment(formData: FormData, packages: Package[], studentCount?: number) {
        const currentUserId = await getCurrentUserId()
        const selectedPackage = packages.find(p => p.id === formData.package_id)
        if (!selectedPackage) {
            throw new Error('Selected package not found')
        }

        // Generate class dates (weekly by default for crash courses)
        const classDates = this.generateCrashCourseDates(
            formData.start_date,
            selectedPackage.class_count,
            'weekly'
        )

        // Calculate per-class amount based on payment type
        const perClassAmount = this.calculatePaymentAmount(formData, 'crash_course', selectedPackage.class_count, studentCount)

        // Create assignments for each date
        const assignments = classDates.map(date => {
            const assignment: any = {
                package_id: formData.package_id,
                date: date,
                start_time: formData.start_time,
                end_time: formData.end_time,
                instructor_id: formData.instructor_id,
                payment_amount: perClassAmount,
                schedule_type: 'crash',
                assigned_by: currentUserId,
                booking_type: formData.booking_type || 'individual',
                class_status: 'scheduled',
                payment_status: 'pending',
                instructor_status: 'pending'
            }

            // Add optional fields only if they have values
            if (formData.notes) assignment.notes = formData.notes
            if (formData.booking_id && formData.booking_id.trim() !== '' && formData.booking_id.trim() !== 'null' && formData.booking_id.trim() !== 'undefined') {
                assignment.booking_id = formData.booking_id.trim()
            }
            if (formData.client_name) assignment.client_name = formData.client_name
            if (formData.client_email) assignment.client_email = formData.client_email

            return assignment
        })

        const cleanedAssignments = await Promise.all(assignments.map(cleanAssignmentData))
        const { error } = await supabase
            .from('class_assignments')
            .insert(cleanedAssignments)

        if (error) throw error

        // Update booking status if linked
        if (formData.booking_id) {
            await this.updateBookingStatus(formData.booking_id, 'completed')
        }

        return { success: true, count: assignments.length }
    }

    private static generateCrashCourseDates(startDate: string, classCount: number, frequency: string): string[] {
        const dates = []
        const currentDate = new Date(startDate)

        for (let i = 0; i < classCount; i++) {
            dates.push(currentDate.toISOString().split('T')[0])

            switch (frequency) {
                case 'daily':
                    currentDate.setDate(currentDate.getDate() + 1)
                    break
                case 'weekly':
                    currentDate.setDate(currentDate.getDate() + 7)
                    break
                case 'specific':
                    // TODO: Implement specific days logic based on formData.specific_days
                    currentDate.setDate(currentDate.getDate() + 7) // Default to weekly for now
                    break
            }
        }

        return dates
    }

    private static async createPackageAssignment(formData: FormData, packages: Package[], studentCount?: number) {
        const selectedPackage = packages.find(p => p.id === formData.package_id)
        if (!selectedPackage) {
            throw new Error('Selected package not found')
        }

        const assignments = []

        // Calculate per-class amount based on payment type
        const perClassAmount = this.calculatePaymentAmount(formData, 'package', selectedPackage.class_count, studentCount)

        if (formData.monthly_assignment_method === 'weekly_recurrence') {
            // Weekly recurrence method
            assignments.push(...await this.generateWeeklyRecurrenceAssignments(formData, perClassAmount))
        } else {
            // Manual calendar selection method
            assignments.push(...await this.generateManualCalendarAssignments(formData, perClassAmount))
        }

        const cleanedAssignments = await Promise.all(assignments.map(cleanAssignmentData))
        const { error } = await supabase
            .from('class_assignments')
            .insert(cleanedAssignments)

        if (error) throw error

        // Update booking status if linked
        if (formData.booking_id) {
            await this.updateBookingStatus(formData.booking_id, 'completed')
        }

        return { success: true, count: assignments.length }
    }

    private static calculatePaymentAmount(formData: FormData, _assignmentType: string, classCount?: number, studentCount?: number): number {
        const totalClasses = classCount || formData.total_classes
        const actualStudentCount = studentCount || 1

        switch (formData.payment_type) {
            case 'per_class':
                // Amount per class (as entered)
                return formData.payment_amount
            case 'per_student_per_class':
                // Amount per student per class × students
                return formData.payment_amount * actualStudentCount
            case 'per_member':
                // Monthly amount per member × students ÷ classes per month
                const classesPerMonth = totalClasses / Math.ceil(totalClasses / 4) || 1
                return (formData.payment_amount * actualStudentCount) / classesPerMonth
            case 'monthly':
                // Fixed monthly rate ÷ classes per month
                const avgClassesPerMonth = totalClasses / Math.ceil(totalClasses / 4) || 1
                return formData.payment_amount / avgClassesPerMonth
            case 'per_class_total':
                // Total amount for all students per class (as entered)
                return formData.payment_amount
            case 'total_duration':
                // Total duration amount ÷ total classes
                return totalClasses > 0 ? formData.payment_amount / totalClasses : formData.payment_amount
            default:
                return formData.payment_amount
        }
    }

    private static async updateBookingStatus(bookingId: string, status: string) {
        try {
            const { error } = await supabase
                .from('bookings')
                .update({ status })
                .eq('id', bookingId)

            if (error) {
                console.warn('Failed to update booking status:', error)
                // Don't throw error for booking status update failure
            }
        } catch (error) {
            console.warn('Failed to update booking status:', error)
        }
    }
}