import { supabase } from '../lib/supabase'
import { FormData, Package } from '../types'

export class AssignmentCreationService {
    static async createAssignment(formData: FormData, packages: Package[]) {
        switch (formData.assignment_type) {
            case 'adhoc':
                return this.createAdhocAssignment(formData)
            case 'weekly':
                return this.createWeeklyAssignment(formData)
            case 'monthly':
                return this.createMonthlyAssignment(formData)
            case 'crash_course':
                return this.createCrashCourseAssignment(formData, packages)
            case 'package':
                return this.createPackageAssignment(formData, packages)
            default:
                throw new Error(`Unknown assignment type: ${formData.assignment_type}`)
        }
    }

    private static async createAdhocAssignment(formData: FormData) {
        const assignmentData = {
            class_type_id: formData.class_type_id,
            date: formData.date,
            start_time: formData.start_time,
            end_time: formData.end_time,
            instructor_id: formData.instructor_id,
            payment_amount: formData.payment_amount,
            notes: formData.notes,
            schedule_type: 'adhoc',
            assigned_at: new Date().toISOString(),
            assigned_by: 'system', // Replace with actual user ID
            booking_id: formData.booking_id || null,
            client_name: formData.client_name || null,
            client_email: formData.client_email || null
        }

        const { error } = await supabase
            .from('class_assignments')
            .insert([assignmentData])

        if (error) throw error

        // Update booking status if linked
        if (formData.booking_id) {
            await this.updateBookingStatus(formData.booking_id, 'completed')
        }

        return { success: true, count: 1 }
    }

    private static async createWeeklyAssignment(formData: FormData) {
        if (formData.monthly_assignment_method === 'weekly_recurrence' && formData.selected_template_id) {
            return this.createWeeklyFromTemplate(formData)
        } else {
            return this.createNewWeeklySchedule(formData)
        }
    }

    private static async createWeeklyFromTemplate(formData: FormData) {
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
        const assignments = this.generateWeeklyAssignments(
            formData,
            template.day_of_week,
            template.start_time,
            template.end_time,
            template.class_type_id
        )

        const { error: insertError } = await supabase
            .from('class_assignments')
            .insert(assignments)

        if (insertError) throw insertError

        // Update booking status if linked
        if (formData.booking_id) {
            await this.updateBookingStatus(formData.booking_id, 'completed')
        }

        return { success: true, count: assignments.length }
    }

    private static async createNewWeeklySchedule(formData: FormData) {
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
        const assignments = this.generateWeeklyAssignments(
            formData,
            formData.day_of_week,
            formData.start_time,
            formData.end_time,
            formData.class_type_id
        )

        const { error: assignmentError } = await supabase
            .from('class_assignments')
            .insert(assignments)

        if (assignmentError) throw assignmentError

        // Update booking status if linked
        if (formData.booking_id) {
            await this.updateBookingStatus(formData.booking_id, 'completed')
        }

        return { success: true, count: assignments.length }
    }

    private static generateWeeklyAssignments(
        formData: FormData,
        dayOfWeek: number,
        startTime: string,
        endTime: string,
        classTypeId: string
    ) {
        const assignments = []
        const startDate = new Date(formData.start_date)
        const endDate = new Date(formData.start_date)
        
        // Calculate end date based on duration
        if (formData.course_duration_unit === 'weeks') {
            endDate.setDate(startDate.getDate() + (formData.course_duration_value * 7))
        } else {
            endDate.setMonth(startDate.getMonth() + formData.course_duration_value)
        }

        // Find the first occurrence of the specified day
        const currentDate = new Date(startDate)
        while (currentDate.getDay() !== dayOfWeek) {
            currentDate.setDate(currentDate.getDate() + 1)
        }

        // Create assignments for each occurrence
        let classCount = 0
        while (currentDate <= endDate && classCount < formData.total_classes) {
            const assignment = {
                class_type_id: classTypeId,
                date: currentDate.toISOString().split('T')[0],
                start_time: startTime,
                end_time: endTime,
                instructor_id: formData.instructor_id,
                payment_amount: this.calculatePaymentAmount(formData, 'weekly'),
                notes: formData.notes,
                schedule_type: 'weekly',
                assigned_at: new Date().toISOString(),
                assigned_by: 'system',
                booking_id: formData.booking_id || null,
                client_name: formData.client_name || null,
                client_email: formData.client_email || null
            }

            assignments.push(assignment)
            classCount++

            // Move to next week
            currentDate.setDate(currentDate.getDate() + 7)
        }

        return assignments
    }

    private static async createMonthlyAssignment(formData: FormData) {
        const assignments = []
        let perClassAmount: number

        // Calculate per-class amount based on payment type
        if (formData.payment_type === 'monthly') {
            // Monthly payment should be divided across all classes in the package
            perClassAmount = formData.payment_amount / formData.total_classes
        } else if (formData.payment_type === 'total_duration') {
            // Total duration payment should be divided across all classes in the package
            perClassAmount = formData.payment_amount / formData.total_classes
        } else if (formData.payment_type === 'per_class') {
            // Per class payment stays as entered
            perClassAmount = formData.payment_amount
        } else {
            // For other payment types, use the amount as entered
            perClassAmount = formData.payment_amount
        }

        if (formData.monthly_assignment_method === 'weekly_recurrence') {
            assignments.push(...this.generateWeeklyRecurrenceAssignments(formData, perClassAmount))
        } else {
            assignments.push(...this.generateManualCalendarAssignments(formData, perClassAmount))
        }

        const { error } = await supabase
            .from('class_assignments')
            .insert(assignments)

        if (error) throw error

        // Update booking status if linked
        if (formData.booking_id) {
            await this.updateBookingStatus(formData.booking_id, 'completed')
        }

        return { success: true, count: assignments.length }
    }

    private static generateWeeklyRecurrenceAssignments(formData: FormData, perClassAmount: number) {
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
                const assignment = {
                    class_type_id: formData.class_type_id,
                    date: currentDate.toISOString().split('T')[0],
                    start_time: formData.start_time,
                    end_time: formData.end_time,
                    instructor_id: formData.instructor_id,
                    payment_amount: perClassAmount,
                    notes: formData.notes,
                    schedule_type: 'monthly',
                    assigned_at: new Date().toISOString(),
                    assigned_by: 'system',
                    booking_id: formData.booking_id || null,
                    client_name: formData.client_name || null,
                    client_email: formData.client_email || null
                }

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

    private static generateManualCalendarAssignments(formData: FormData, perClassAmount: number) {
        // Validate manual selections
        if (!formData.manual_selections || formData.manual_selections.length === 0) {
            throw new Error('Please select at least one class date and time')
        }

        // Create assignments from manual selections
        return formData.manual_selections.map(selection => ({
            class_type_id: formData.class_type_id,
            date: selection.date,
            start_time: selection.start_time,
            end_time: selection.end_time,
            instructor_id: formData.instructor_id,
            payment_amount: perClassAmount,
            notes: formData.notes,
            schedule_type: 'monthly',
            assigned_at: new Date().toISOString(),
            assigned_by: 'system',
            booking_id: formData.booking_id || null,
            client_name: formData.client_name || null,
            client_email: formData.client_email || null
        }))
    }

    private static async createCrashCourseAssignment(formData: FormData, packages: Package[]) {
        const selectedPackage = packages.find(p => p.id === formData.package_id)
        if (!selectedPackage) {
            throw new Error('Selected package not found')
        }

        // Generate class dates based on frequency
        const classDates = this.generateCrashCourseDates(
            formData.start_date,
            selectedPackage.class_count,
            formData.class_frequency
        )

        // Calculate per-class amount based on payment type
        const perClassAmount = this.calculatePaymentAmount(formData, 'crash_course', selectedPackage.class_count)

        // Create assignments for each date
        const assignments = classDates.map(date => ({
            class_type_id: formData.class_type_id,
            date: date,
            start_time: formData.start_time,
            end_time: formData.end_time,
            instructor_id: formData.instructor_id,
            payment_amount: perClassAmount,
            notes: formData.notes,
            schedule_type: 'crash',
            assigned_at: new Date().toISOString(),
            assigned_by: 'system',
            booking_id: formData.booking_id || null,
            client_name: formData.client_name || null,
            client_email: formData.client_email || null
        }))

        const { error } = await supabase
            .from('class_assignments')
            .insert(assignments)

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

    private static async createPackageAssignment(formData: FormData, packages: Package[]) {
        const selectedPackage = packages.find(p => p.id === formData.package_id)
        if (!selectedPackage) {
            throw new Error('Selected package not found')
        }

        const assignments = []

        // Calculate per-class amount based on payment type
        let perClassAmount: number
        switch (formData.payment_type) {
            case 'monthly':
                // Monthly payment should be divided across all classes in the package
                perClassAmount = formData.payment_amount / selectedPackage.class_count
                break
            case 'total_duration':
                // Total duration payment should be divided across all classes in the package
                perClassAmount = formData.payment_amount / selectedPackage.class_count
                break
            case 'per_class':
                // Per class payment stays as entered
                perClassAmount = formData.payment_amount
                break
            default:
                // For other payment types, use the amount as entered
                perClassAmount = formData.payment_amount
                break
        }

        if (formData.monthly_assignment_method === 'weekly_recurrence') {
            // Weekly recurrence method
            assignments.push(...this.generateWeeklyRecurrenceAssignments(formData, perClassAmount))
        } else {
            // Manual calendar selection method
            assignments.push(...this.generateManualCalendarAssignments(formData, perClassAmount))
        }

        const { error } = await supabase
            .from('class_assignments')
            .insert(assignments)

        if (error) throw error

        // Update booking status if linked
        if (formData.booking_id) {
            await this.updateBookingStatus(formData.booking_id, 'completed')
        }

        return { success: true, count: assignments.length }
    }

    private static calculatePaymentAmount(formData: FormData, _assignmentType: string, classCount?: number): number {
        const totalClasses = classCount || formData.total_classes

        switch (formData.payment_type) {
            case 'per_class':
                return formData.payment_amount
            case 'total_duration':
            case 'monthly':
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