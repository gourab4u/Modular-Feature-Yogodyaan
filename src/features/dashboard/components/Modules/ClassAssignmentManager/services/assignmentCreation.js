import { supabase } from '../../../../../../shared/lib/supabase';
// Helper function to validate UUID format
const isValidUUID = (uuid) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
};
// Helper function to validate booking exists in database
const validateBookingExists = async (bookingId) => {
    if (!bookingId || bookingId.trim() === '' || bookingId.trim() === 'null' || bookingId.trim() === 'undefined') {
        return true; // No booking to validate
    }
    // booking_id is TEXT format (YOG-YYYYMMDD-XXXX), not UUID, so skip UUID validation
    // if (!isValidUUID(bookingId.trim())) {
    //     console.warn('Invalid booking ID format:', bookingId)
    //     return false
    // }
    try {
        console.log('Validating booking ID:', bookingId.trim());
        const { data: bookings, error: bookingError } = await supabase
            .from('bookings')
            .select('booking_id')
            .eq('booking_id', bookingId.trim());
        if (bookingError) {
            console.error('Booking validation failed:', {
                bookingId: bookingId.trim(),
                error: bookingError,
                data: bookings
            });
            return false;
        }
        if (!bookings || bookings.length === 0) {
            console.error('Booking validation failed - no booking found:', {
                bookingId: bookingId.trim(),
                data: bookings
            });
            return false;
        }
        console.log('Booking validation successful for ID:', bookingId.trim());
        return true;
    }
    catch (error) {
        console.error('Exception during booking validation:', error);
        return false;
    }
};
// Helper function to validate booking IDs based on assignment type
const validateBookingsForAssignmentType = async (bookingIds, assignmentType, bookingType) => {
    if (!bookingIds || bookingIds.length === 0) {
        return; // No bookings to validate
    }
    // Validate booking count based on assignment type and booking type
    const shouldAllowMultiple = shouldAllowMultipleBookings(assignmentType, bookingType);
    if (!shouldAllowMultiple && bookingIds.length > 1) {
        throw new Error(`Individual and private group classes can only have one booking. You have selected ${bookingIds.length} bookings.`);
    }
    // Validate each booking exists
    for (const bookingId of bookingIds) {
        if (bookingId && bookingId.trim() !== '') {
            console.log('VALIDATION DEBUG - About to validate booking_id:', bookingId);
            const bookingExists = await validateBookingExists(bookingId);
            console.log('VALIDATION DEBUG - Booking validation result:', bookingExists);
            if (!bookingExists) {
                console.error('Invalid booking_id found - booking does not exist in database:', bookingId);
                throw new Error(`Selected booking is invalid or has been deleted. Please select a different booking or remove the booking selection.`);
            }
            console.log('VALIDATION DEBUG - Booking validation passed for:', bookingId);
        }
    }
};
// Helper function to determine if assignment type allows multiple bookings
const shouldAllowMultipleBookings = (assignmentType, bookingType) => {
    // Individual booking type: single booking only regardless of assignment type
    if (bookingType === 'individual') {
        return false;
    }
    // Private group classes: single booking only (for adhoc assignments)
    if (assignmentType === 'adhoc' && bookingType === 'private_group') {
        return false;
    }
    // All other cases: multiple bookings allowed
    // - Weekly classes (public_group)
    // - Corporate bookings
    // - Monthly packages (corporate, private_group, public_group)
    // - Crash courses (corporate, private_group, public_group)
    return true;
};
// Helper function to create assignment-booking associations
export const createAssignmentBookings = async (assignmentId, bookingIds) => {
    if (!bookingIds || bookingIds.length === 0) {
        return; // No bookings to associate
    }
    const associations = bookingIds
        .filter(id => id && id.trim() !== '')
        .map(bookingId => ({
        assignment_id: assignmentId,
        booking_id: bookingId.trim()
    }));
    if (associations.length > 0) {
        const { error } = await supabase
            .from('assignment_bookings')
            .insert(associations);
        if (error) {
            console.error('Failed to create assignment-booking associations:', error);
            throw new Error(`Failed to link bookings to assignment: ${error.message}`);
        }
        console.log(`Successfully created ${associations.length} assignment-booking associations`);
    }
};
// Helper function to clean assignment data - removes empty UUID fields that would cause 22P02 errors
const cleanAssignmentData = async (data) => {
    const cleaned = { ...data };
    // List of ALL UUID fields that could be empty (removed booking_id since we use junction table now)
    const uuidFields = ['class_type_id', 'package_id', 'instructor_id', 'assigned_by'];
    // Remove booking-related fields (now handled via junction table)
    delete cleaned.booking_id;
    delete cleaned.client_name;
    delete cleaned.client_email;
    uuidFields.forEach(field => {
        if (cleaned[field] === '' || cleaned[field] === null || cleaned[field] === undefined ||
            cleaned[field] === 'null' || cleaned[field] === 'undefined' ||
            (typeof cleaned[field] === 'string' && cleaned[field].trim() === '')) {
            if (field === 'class_type_id') {
                // class_type_id is only required for adhoc assignments
                // For package-based assignments, it can be null/empty
                delete cleaned[field];
            }
            else if (field === 'package_id') {
                // package_id is only required for package-based assignments
                // For adhoc assignments, it can be null/empty
                delete cleaned[field];
            }
            else if (field === 'instructor_id') {
                throw new Error('Please select an instructor before creating the assignment');
            }
            else if (field === 'assigned_by') {
                throw new Error('Authentication error - please log out and log in again');
            }
            else {
                delete cleaned[field];
            }
        }
    });
    console.log('Original data:', JSON.stringify(data, null, 2));
    console.log('Cleaned data:', JSON.stringify(cleaned, null, 2));
    return cleaned;
};
// Helper function to clean multiple assignments with booking validation
const cleanAssignmentsBatch = async (assignments, bookingIds = [], assignmentType = '', bookingType = '') => {
    if (!assignments || assignments.length === 0)
        return [];
    // Validate all booking IDs once with assignment type rules
    await validateBookingsForAssignmentType(bookingIds, assignmentType, bookingType);
    // Clean all assignments (booking fields will be removed since we use junction table)
    return await Promise.all(assignments.map(assignment => cleanAssignmentData(assignment)));
};
// Helper function to get current user ID - requires authentication
const getCurrentUserId = async () => {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
            console.error('Auth error getting current user:', error);
            throw new Error('Authentication failed. Please log in to create assignments.');
        }
        if (!user || !user.id) {
            console.error('No authenticated user found');
            throw new Error('You must be logged in to create assignments. Please log in and try again.');
        }
        // Check if user.id is a valid UUID (not empty string)
        if (typeof user.id !== 'string' || user.id.trim() === '') {
            console.error('Invalid user ID:', user.id);
            throw new Error('Invalid authentication state. Please log out and log in again.');
        }
        console.log('Current user ID:', user.id);
        return user.id;
    }
    catch (error) {
        if (error.message && error.message.includes('log in')) {
            throw error; // Re-throw authentication errors as-is
        }
        console.error('Failed to get current user:', error);
        throw new Error('Authentication failed. Please log in to create assignments.');
    }
};
/**
 * Rate helpers to read/write instructor_rates as per rules:
 * - For all types except "package" (custom), try to pull rate from instructor_rates.
 * - If not available and user enters an amount, insert a new row (do NOT update if one exists).
 */
const getScheduleTypeForRate = (assignmentType) => {
    switch (assignmentType) {
        case 'adhoc':
        case 'weekly':
        case 'monthly':
            return assignmentType;
        case 'crash_course':
            return 'crash';
        case 'package':
            return undefined; // custom: skip
        default:
            return assignmentType;
    }
};
const findExistingRate = async ({ scheduleType, category, classTypeId, packageId }) => {
    const today = new Date().toISOString().split('T')[0];
    let q = supabase
        .from('instructor_rates')
        .select('*')
        .eq('schedule_type', scheduleType)
        .eq('category', category)
        .eq('is_active', true)
        .lte('effective_from', today)
        .or(`effective_until.is.null,effective_until.gte.${today}`);
    if (classTypeId) {
        // @ts-ignore
        q = q.eq('class_type_id', classTypeId).is('package_id', null);
    }
    else if (packageId) {
        // @ts-ignore
        q = q.eq('package_id', packageId).is('class_type_id', null);
    }
    else {
        // @ts-ignore
        q = q.is('class_type_id', null).is('package_id', null);
    }
    const { data, error } = await q.order('created_at', { ascending: false }).limit(1).single();
    if (error && error.code !== 'PGRST116')
        throw error;
    return data;
};
const ensureInstructorRateIfMissing = async (assignmentType, category, amount, classTypeId, packageId) => {
    const scheduleType = getScheduleTypeForRate(assignmentType);
    if (!scheduleType)
        return; // skip custom package type
    if (!amount || amount <= 0)
        return;
    const existing = await findExistingRate({ scheduleType, category, classTypeId, packageId });
    if (existing)
        return; // do not update existing as per requirement
    const created_by = await getCurrentUserId();
    const payload = {
        schedule_type: scheduleType,
        category,
        rate_amount: amount,
        created_by,
        is_active: true
    };
    if (classTypeId)
        payload.class_type_id = classTypeId;
    if (packageId)
        payload.package_id = packageId;
    const { error } = await supabase.from('instructor_rates').insert([payload]);
    // Ignore unique violation if concurrent insert happened
    if (error && error.code !== '23505') {
        console.warn('Failed to insert instructor rate:', error);
    }
};
export class AssignmentCreationService {
    static async createAssignment(formData, packages, studentCount) {
        switch (formData.assignment_type) {
            case 'adhoc':
                return this.createAdhocAssignment(formData, studentCount);
            case 'weekly':
                return this.createWeeklyAssignment(formData, studentCount);
            case 'monthly':
                return this.createMonthlyAssignment(formData, studentCount);
            case 'crash_course':
                return this.createCrashCourseAssignment(formData, packages, studentCount);
            case 'package':
                return this.createPackageAssignment(formData, packages, studentCount);
            default:
                throw new Error(`Unknown assignment type: ${formData.assignment_type}`);
        }
    }
    static async createAdhocAssignment(formData, studentCount) {
        const currentUserId = await getCurrentUserId();
        // Validate required fields
        if (!formData.class_type_id || formData.class_type_id.trim() === '') {
            throw new Error('Class type is required');
        }
        if (!formData.instructor_id || formData.instructor_id.trim() === '') {
            throw new Error('Instructor is required');
        }
        // Validate UUID formats  
        if (!isValidUUID(formData.class_type_id.trim())) {
            throw new Error('Invalid class type ID format');
        }
        if (!isValidUUID(formData.instructor_id.trim())) {
            throw new Error('Invalid instructor ID format');
        }
        if (!isValidUUID(currentUserId.trim())) {
            throw new Error('Invalid user authentication - please log out and log in again');
        }
        // Booking validation is now handled in cleanAssignmentData function
        if (!formData.date || formData.date.trim() === '') {
            throw new Error('Date is required');
        }
        if (!formData.start_time || formData.start_time.trim() === '') {
            throw new Error('Start time is required');
        }
        if (!formData.end_time || formData.end_time.trim() === '') {
            throw new Error('End time is required');
        }
        // Validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(formData.date)) {
            throw new Error('Date must be in YYYY-MM-DD format');
        }
        // Validate time format (HH:MM or HH:MM:SS)
        const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;
        if (!timeRegex.test(formData.start_time)) {
            throw new Error('Start time must be in HH:MM format');
        }
        if (!timeRegex.test(formData.end_time)) {
            throw new Error('End time must be in HH:MM format');
        }
        // Validate payment amount is a valid number
        if (isNaN(formData.payment_amount) || formData.payment_amount < 0) {
            throw new Error('Payment amount must be a valid positive number');
        }
        // Ensure baseline instructor rate exists when missing (non-custom)
        await ensureInstructorRateIfMissing('adhoc', formData.booking_type || 'individual', formData.payment_amount, formData.class_type_id, undefined);
        // Calculate payment amount using centralized logic
        const paymentAmount = this.calculatePaymentAmount(formData, 'adhoc', 1, studentCount);
        // Create assignment data with required fields only, add others conditionally
        const assignmentData = {
            class_type_id: formData.class_type_id.trim(),
            date: formData.date.trim(),
            start_time: formData.start_time.trim(),
            end_time: formData.end_time.trim(),
            instructor_id: formData.instructor_id.trim(),
            payment_amount: paymentAmount,
            payment_type: formData.payment_type,
            schedule_type: 'adhoc',
            assigned_by: currentUserId.trim(),
            booking_type: formData.booking_type || 'individual'
        };
        // Add optional fields only if they have valid non-empty values
        if (formData.notes && formData.notes.trim() !== '') {
            assignmentData.notes = formData.notes.trim();
        }
        if (formData.booking_id && formData.booking_id.trim() !== '' && formData.booking_id.trim() !== 'null' && formData.booking_id.trim() !== 'undefined') {
            assignmentData.booking_id = formData.booking_id.trim();
        }
        if (formData.client_name && formData.client_name.trim() !== '') {
            assignmentData.client_name = formData.client_name.trim();
        }
        if (formData.client_email && formData.client_email.trim() !== '') {
            assignmentData.client_email = formData.client_email.trim();
        }
        // Set default status fields that might be required
        assignmentData.class_status = 'scheduled';
        assignmentData.payment_status = 'pending';
        assignmentData.instructor_status = 'pending';
        // Clean the assignment data to remove empty UUID fields
        const cleanedAssignmentData = await cleanAssignmentData(assignmentData);
        console.log('Assignment data being inserted:', JSON.stringify(cleanedAssignmentData, null, 2));
        console.log('Current user ID was:', currentUserId);
        // Debug booking_id specifically
        if (cleanedAssignmentData.booking_id) {
            console.log('BOOKING DEBUG - Final booking_id:', cleanedAssignmentData.booking_id);
            console.log('BOOKING DEBUG - Booking_id type:', typeof cleanedAssignmentData.booking_id);
            console.log('BOOKING DEBUG - Booking_id length:', cleanedAssignmentData.booking_id.length);
        }
        const { data: insertedAssignment, error } = await supabase
            .from('class_assignments')
            .insert([cleanedAssignmentData])
            .select('id')
            .single();
        if (error) {
            console.error('Supabase insert error:', {
                error,
                code: error.code,
                message: error.message,
                details: error.details,
                hint: error.hint,
                assignmentData
            });
            throw new Error(`Database error: ${error.message || 'Unknown error occurred while creating assignment'}`);
        }
        // Create booking associations using the new multiple booking system
        const bookingIds = formData.booking_ids && formData.booking_ids.length > 0
            ? formData.booking_ids
            : (formData.booking_id ? [formData.booking_id] : []);
        if (bookingIds.length > 0) {
            await createAssignmentBookings(insertedAssignment.id, bookingIds);
            // Update booking status for all linked bookings if needed
            for (const bookingId of bookingIds) {
                if (bookingId && bookingId.trim() !== '') {
                    await this.updateBookingStatus(bookingId, 'completed');
                }
            }
        }
        return { success: true, count: 1 };
    }
    static async createWeeklyAssignment(formData, studentCount) {
        if (formData.monthly_assignment_method === 'weekly_recurrence' && formData.selected_template_id) {
            return this.createWeeklyFromTemplate(formData, studentCount);
        }
        else {
            return this.createNewWeeklySchedule(formData, studentCount);
        }
    }
    static async createWeeklyFromTemplate(formData, studentCount) {
        // Get template details
        const { data: template, error: templateError } = await supabase
            .from('class_schedules')
            .select('*')
            .eq('id', formData.selected_template_id)
            .single();
        if (templateError)
            throw templateError;
        // Update the template with the assigned instructor
        const { error: updateError } = await supabase
            .from('class_schedules')
            .update({
            instructor_id: formData.instructor_id,
            notes: formData.notes
        })
            .eq('id', formData.selected_template_id);
        if (updateError)
            throw updateError;
        // Ensure baseline instructor rate exists for weekly (template)
        await ensureInstructorRateIfMissing('weekly', formData.booking_type || 'public_group', formData.payment_amount, template.class_type_id, undefined);
        // Create weekly assignments based on the template
        const assignments = await this.generateWeeklyAssignments(formData, template.day_of_week, template.start_time, template.end_time, template.class_type_id, studentCount);
        const cleanedAssignments = await cleanAssignmentsBatch(assignments);
        const { error: insertError } = await supabase
            .from('class_assignments')
            .insert(cleanedAssignments);
        if (insertError)
            throw insertError;
        // Update booking status if linked
        if (formData.booking_id) {
            await this.updateBookingStatus(formData.booking_id, 'completed');
        }
        return { success: true, count: assignments.length };
    }
    static async createNewWeeklySchedule(formData, studentCount) {
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
        };
        const { error: scheduleError } = await supabase
            .from('class_schedules')
            .insert([scheduleData]);
        if (scheduleError)
            throw scheduleError;
        // Ensure baseline instructor rate exists for weekly (new schedule)
        await ensureInstructorRateIfMissing('weekly', formData.booking_type || 'public_group', formData.payment_amount, formData.class_type_id, undefined);
        // Generate weekly assignments
        const assignments = await this.generateWeeklyAssignments(formData, formData.day_of_week, formData.start_time, formData.end_time, formData.class_type_id, studentCount);
        const cleanedAssignments = await cleanAssignmentsBatch(assignments);
        const { error: assignmentError } = await supabase
            .from('class_assignments')
            .insert(cleanedAssignments);
        if (assignmentError)
            throw assignmentError;
        // Update booking status if linked
        if (formData.booking_id) {
            await this.updateBookingStatus(formData.booking_id, 'completed');
        }
        return { success: true, count: assignments.length };
    }
    static async generateWeeklyAssignments(formData, dayOfWeek, startTime, endTime, classTypeId, studentCount) {
        const currentUserId = await getCurrentUserId();
        const assignments = [];
        const startDate = new Date(formData.start_date);
        // Use end_date if provided, otherwise default to end of current year
        const endDate = formData.end_date
            ? new Date(formData.end_date)
            : new Date(`${new Date().getFullYear()}-12-31`);
        // Find the first occurrence of the specified day
        const currentDate = new Date(startDate);
        while (currentDate.getDay() !== dayOfWeek) {
            currentDate.setDate(currentDate.getDate() + 1);
        }
        // Create assignments for each occurrence until end date
        while (currentDate <= endDate) {
            const assignment = {
                class_type_id: classTypeId,
                date: currentDate.toISOString().split('T')[0],
                start_time: startTime,
                end_time: endTime,
                instructor_id: formData.instructor_id,
                payment_amount: this.calculatePaymentAmount(formData, 'weekly', undefined, studentCount),
                payment_type: formData.payment_type,
                schedule_type: 'weekly',
                assigned_by: currentUserId,
                booking_type: formData.booking_type || 'public_group',
                class_status: 'scheduled',
                payment_status: 'pending',
                instructor_status: 'pending'
            };
            // Add optional fields only if they have values
            if (formData.notes)
                assignment.notes = formData.notes;
            if (formData.booking_id && formData.booking_id.trim() !== '' && formData.booking_id.trim() !== 'null' && formData.booking_id.trim() !== 'undefined') {
                assignment.booking_id = formData.booking_id.trim();
            }
            if (formData.client_name)
                assignment.client_name = formData.client_name;
            if (formData.client_email)
                assignment.client_email = formData.client_email;
            assignments.push(assignment);
            // Move to next week
            currentDate.setDate(currentDate.getDate() + 7);
        }
        return assignments;
    }
    static async createMonthlyAssignment(formData, studentCount) {
        const assignments = [];
        let perClassAmount;
        // Calculate per-class amount based on payment type
        perClassAmount = this.calculatePaymentAmount(formData, 'monthly', undefined, studentCount);
        // Ensure baseline instructor rate exists for monthly (package-based)
        await ensureInstructorRateIfMissing('monthly', formData.booking_type || 'individual', formData.payment_amount, undefined, formData.package_id);
        if (formData.monthly_assignment_method === 'weekly_recurrence') {
            assignments.push(...await this.generateWeeklyRecurrenceAssignments(formData, perClassAmount));
        }
        else {
            assignments.push(...await this.generateManualCalendarAssignments(formData, perClassAmount));
        }
        // Get booking IDs (support both new and old format)
        const bookingIds = formData.booking_ids && formData.booking_ids.length > 0
            ? formData.booking_ids
            : (formData.booking_id ? [formData.booking_id] : []);
        const cleanedAssignments = await cleanAssignmentsBatch(assignments, bookingIds, 'monthly', formData.booking_type || 'individual');
        const { data: insertedAssignments, error } = await supabase
            .from('class_assignments')
            .insert(cleanedAssignments)
            .select('id');
        if (error)
            throw error;
        // Create booking associations for all assignments using the new junction table system
        if (bookingIds.length > 0 && insertedAssignments) {
            for (const assignment of insertedAssignments) {
                await createAssignmentBookings(assignment.id, bookingIds);
            }
            // Update booking status for all linked bookings
            for (const bookingId of bookingIds) {
                if (bookingId && bookingId.trim() !== '') {
                    await this.updateBookingStatus(bookingId, 'completed');
                }
            }
        }
        return { success: true, count: assignments.length };
    }
    static async generateWeeklyRecurrenceAssignments(formData, perClassAmount) {
        const currentUserId = await getCurrentUserId();
        const assignments = [];
        // Validate weekly days selection
        if (!formData.weekly_days || formData.weekly_days.length === 0) {
            throw new Error('Please select at least one day of the week');
        }
        // Sort selected days to ensure proper chronological order
        const sortedWeeklyDays = [...formData.weekly_days].sort((a, b) => a - b);
        // Continue creating assignments until we hit the class count or end date
        const startDate = new Date(formData.start_date);
        const validityEndDate = formData.validity_end_date ? new Date(formData.validity_end_date) : null;
        let classesCreated = 0;
        let currentWeekStart = new Date(startDate);
        // Find the start of the week (Sunday)
        currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());
        while (classesCreated < formData.total_classes) {
            // For each week, create classes for all selected days
            for (const dayOfWeek of sortedWeeklyDays) {
                if (classesCreated >= formData.total_classes) {
                    break;
                }
                const classDate = new Date(currentWeekStart);
                classDate.setDate(currentWeekStart.getDate() + dayOfWeek);
                // Skip if the class date is before the start date
                if (classDate < startDate) {
                    continue;
                }
                // Check if we've exceeded the validity period
                if (validityEndDate && classDate > validityEndDate) {
                    console.warn(`Reached validity end date (${formData.validity_end_date}). Created ${classesCreated} classes out of requested ${formData.total_classes}.`);
                    return assignments;
                }
                const assignment = {
                    package_id: formData.package_id,
                    date: classDate.toISOString().split('T')[0],
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
                };
                // Add optional fields only if they have values
                if (formData.notes)
                    assignment.notes = formData.notes;
                if (formData.booking_id && formData.booking_id.trim() !== '' && formData.booking_id.trim() !== 'null' && formData.booking_id.trim() !== 'undefined') {
                    assignment.booking_id = formData.booking_id.trim();
                }
                if (formData.client_name)
                    assignment.client_name = formData.client_name;
                if (formData.client_email)
                    assignment.client_email = formData.client_email;
                assignments.push(assignment);
                classesCreated++;
            }
            // Move to next week
            currentWeekStart.setDate(currentWeekStart.getDate() + 7);
        }
        return assignments;
    }
    static async generateManualCalendarAssignments(formData, perClassAmount) {
        const currentUserId = await getCurrentUserId();
        // Validate manual selections
        if (!formData.manual_selections || formData.manual_selections.length === 0) {
            throw new Error('Please select at least one class date and time');
        }
        // Create assignments from manual selections
        return formData.manual_selections.map(selection => {
            const assignment = {
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
            };
            // Add optional fields only if they have values
            if (formData.notes)
                assignment.notes = formData.notes;
            if (formData.booking_id && formData.booking_id.trim() !== '' && formData.booking_id.trim() !== 'null' && formData.booking_id.trim() !== 'undefined') {
                assignment.booking_id = formData.booking_id.trim();
            }
            if (formData.client_name)
                assignment.client_name = formData.client_name;
            if (formData.client_email)
                assignment.client_email = formData.client_email;
            return assignment;
        });
    }
    static async createCrashCourseAssignment(formData, packages, studentCount) {
        const selectedPackage = packages.find(p => p.id === formData.package_id);
        if (!selectedPackage) {
            throw new Error('Selected package not found');
        }
        const assignments = [];
        // Calculate per-class amount based on payment type
        const perClassAmount = this.calculatePaymentAmount(formData, 'crash_course', selectedPackage.class_count, studentCount);
        // Ensure baseline instructor rate exists for crash course (package-based)
        await ensureInstructorRateIfMissing('crash_course', formData.booking_type || 'individual', formData.payment_amount, undefined, formData.package_id);
        if (formData.monthly_assignment_method === 'weekly_recurrence') {
            // Use crash course specific weekly recurrence method
            assignments.push(...await this.generateCrashCourseWeeklyRecurrenceAssignments(formData, selectedPackage, perClassAmount));
        }
        else if (formData.monthly_assignment_method === 'manual_calendar') {
            // Use manual calendar selection method (same as monthly/package)
            assignments.push(...await this.generateManualCalendarAssignmentsForCrash(formData, perClassAmount));
        }
        else {
            // Fallback to the original weekly generation for backward compatibility
            const classDates = this.generateCrashCourseDates(formData.start_date, selectedPackage.class_count, 'weekly');
            const currentUserId = await getCurrentUserId();
            assignments.push(...classDates.map(date => {
                const assignment = {
                    package_id: formData.package_id,
                    date: date,
                    start_time: formData.start_time,
                    end_time: formData.end_time,
                    instructor_id: formData.instructor_id,
                    payment_amount: perClassAmount,
                    schedule_type: 'crash', // Use 'crash' for crash course assignments
                    assigned_by: currentUserId,
                    booking_type: formData.booking_type || 'individual',
                    class_status: 'scheduled',
                    payment_status: 'pending',
                    instructor_status: 'pending'
                };
                // Add optional fields only if they have values
                if (formData.notes)
                    assignment.notes = formData.notes;
                if (formData.booking_id && formData.booking_id.trim() !== '' && formData.booking_id.trim() !== 'null' && formData.booking_id.trim() !== 'undefined') {
                    assignment.booking_id = formData.booking_id.trim();
                }
                if (formData.client_name)
                    assignment.client_name = formData.client_name;
                if (formData.client_email)
                    assignment.client_email = formData.client_email;
                return assignment;
            }));
        }
        // Get booking IDs (support both new and old format)
        const bookingIds = formData.booking_ids && formData.booking_ids.length > 0
            ? formData.booking_ids
            : (formData.booking_id ? [formData.booking_id] : []);
        const cleanedAssignments = await cleanAssignmentsBatch(assignments, bookingIds, 'crash_course', formData.booking_type || 'individual');
        const { data: insertedAssignments, error } = await supabase
            .from('class_assignments')
            .insert(cleanedAssignments)
            .select('id');
        if (error)
            throw error;
        // Create booking associations for all assignments using the new junction table system
        if (bookingIds.length > 0 && insertedAssignments) {
            for (const assignment of insertedAssignments) {
                await createAssignmentBookings(assignment.id, bookingIds);
            }
            // Update booking status for all linked bookings
            for (const bookingId of bookingIds) {
                if (bookingId && bookingId.trim() !== '') {
                    await this.updateBookingStatus(bookingId, 'completed');
                }
            }
        }
        return { success: true, count: assignments.length };
    }
    static generateCrashCourseDates(startDate, classCount, frequency) {
        const dates = [];
        const currentDate = new Date(startDate);
        for (let i = 0; i < classCount; i++) {
            dates.push(currentDate.toISOString().split('T')[0]);
            switch (frequency) {
                case 'daily':
                    currentDate.setDate(currentDate.getDate() + 1);
                    break;
                case 'weekly':
                    currentDate.setDate(currentDate.getDate() + 7);
                    break;
                case 'specific':
                    // TODO: Implement specific days logic based on formData.specific_days
                    currentDate.setDate(currentDate.getDate() + 7); // Default to weekly for now
                    break;
            }
        }
        return dates;
    }
    static async generateManualCalendarAssignmentsForCrash(formData, perClassAmount) {
        const currentUserId = await getCurrentUserId();
        // Validate manual selections
        if (!formData.manual_selections || formData.manual_selections.length === 0) {
            throw new Error('Please select at least one class date and time');
        }
        // Create assignments from manual selections
        return formData.manual_selections.map(selection => {
            const assignment = {
                package_id: formData.package_id,
                date: selection.date,
                start_time: selection.start_time,
                end_time: selection.end_time,
                instructor_id: formData.instructor_id,
                payment_amount: perClassAmount,
                schedule_type: 'crash',
                assigned_by: currentUserId,
                booking_type: formData.booking_type || 'individual',
                class_status: 'scheduled',
                payment_status: 'pending',
                instructor_status: 'pending'
            };
            // Add optional fields only if they have values
            if (formData.notes)
                assignment.notes = formData.notes;
            if (formData.booking_id && formData.booking_id.trim() !== '' && formData.booking_id.trim() !== 'null' && formData.booking_id.trim() !== 'undefined') {
                assignment.booking_id = formData.booking_id.trim();
            }
            if (formData.client_name)
                assignment.client_name = formData.client_name;
            if (formData.client_email)
                assignment.client_email = formData.client_email;
            return assignment;
        });
    }
    static async createPackageAssignment(formData, packages, studentCount) {
        const selectedPackage = packages.find(p => p.id === formData.package_id);
        if (!selectedPackage) {
            throw new Error('Selected package not found');
        }
        const assignments = [];
        // Calculate per-class amount based on payment type
        const perClassAmount = this.calculatePaymentAmount(formData, 'package', selectedPackage.class_count, studentCount);
        if (formData.monthly_assignment_method === 'weekly_recurrence') {
            // Weekly recurrence method - use package-specific logic
            assignments.push(...await this.generatePackageWeeklyRecurrenceAssignments(formData, selectedPackage, perClassAmount));
        }
        else {
            // Manual calendar selection method
            assignments.push(...await this.generateManualCalendarAssignments(formData, perClassAmount));
        }
        // Get booking IDs (support both new and old format)
        const bookingIds = formData.booking_ids && formData.booking_ids.length > 0
            ? formData.booking_ids
            : (formData.booking_id ? [formData.booking_id] : []);
        const cleanedAssignments = await cleanAssignmentsBatch(assignments, bookingIds, 'package', formData.booking_type || 'individual');
        const { data: insertedAssignments, error } = await supabase
            .from('class_assignments')
            .insert(cleanedAssignments)
            .select('id');
        if (error)
            throw error;
        // Create booking associations for all assignments using the new junction table system
        if (bookingIds.length > 0 && insertedAssignments) {
            for (const assignment of insertedAssignments) {
                await createAssignmentBookings(assignment.id, bookingIds);
            }
            // Update booking status for all linked bookings
            for (const bookingId of bookingIds) {
                if (bookingId && bookingId.trim() !== '') {
                    await this.updateBookingStatus(bookingId, 'completed');
                }
            }
        }
        return { success: true, count: assignments.length };
    }
    static async generatePackageWeeklyRecurrenceAssignments(formData, selectedPackage, perClassAmount) {
        const currentUserId = await getCurrentUserId();
        const assignments = [];
        // Validate weekly days selection
        if (!formData.weekly_days || formData.weekly_days.length === 0) {
            throw new Error('Please select at least one day of the week');
        }
        // Use package class count, not formData.total_classes
        const targetClassCount = selectedPackage.class_count;
        // Calculate validity end date from start date + validity days
        let validityEndDate = null;
        if (selectedPackage.validity_days) {
            validityEndDate = new Date(formData.start_date);
            validityEndDate.setDate(validityEndDate.getDate() + selectedPackage.validity_days);
        }
        // Sort selected days to ensure proper chronological order
        const sortedWeeklyDays = [...formData.weekly_days].sort((a, b) => a - b);
        console.log(`Package assignment: Target ${targetClassCount} classes for days: ${sortedWeeklyDays.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')}`);
        // Continue creating assignments until we hit the package class count or end date
        const startDate = new Date(formData.start_date);
        let classesCreated = 0;
        let currentWeekStart = new Date(startDate);
        // Find the start of the week (Sunday)
        currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());
        while (classesCreated < targetClassCount) {
            // For each week, create classes for all selected days
            for (const dayOfWeek of sortedWeeklyDays) {
                if (classesCreated >= targetClassCount) {
                    break;
                }
                const classDate = new Date(currentWeekStart);
                classDate.setDate(currentWeekStart.getDate() + dayOfWeek);
                // Skip if the class date is before the start date
                if (classDate < startDate) {
                    continue;
                }
                // Check if we've exceeded the validity period
                if (validityEndDate && classDate > validityEndDate) {
                    console.warn(`Reached validity end date (${validityEndDate.toISOString().split('T')[0]}). Created ${classesCreated} classes out of package requirement ${targetClassCount}.`);
                    return assignments;
                }
                const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek];
                console.log(`Creating class on ${classDate.toISOString().split('T')[0]} (${dayName}) - Class ${classesCreated + 1}/${targetClassCount}`);
                const assignment = {
                    package_id: formData.package_id,
                    date: classDate.toISOString().split('T')[0],
                    start_time: formData.start_time,
                    end_time: formData.end_time,
                    instructor_id: formData.instructor_id,
                    payment_amount: perClassAmount,
                    schedule_type: 'monthly', // Use 'monthly' for package assignments
                    assigned_by: currentUserId,
                    booking_type: formData.booking_type || 'individual',
                    class_status: 'scheduled',
                    payment_status: 'pending',
                    instructor_status: 'pending'
                };
                // Add optional fields only if they have values
                if (formData.notes)
                    assignment.notes = formData.notes;
                if (formData.booking_id && formData.booking_id.trim() !== '' && formData.booking_id.trim() !== 'null' && formData.booking_id.trim() !== 'undefined') {
                    assignment.booking_id = formData.booking_id.trim();
                }
                if (formData.client_name)
                    assignment.client_name = formData.client_name;
                if (formData.client_email)
                    assignment.client_email = formData.client_email;
                assignments.push(assignment);
                classesCreated++;
            }
            // Move to next week
            currentWeekStart.setDate(currentWeekStart.getDate() + 7);
        }
        console.log(`Package assignment: Created ${assignments.length} classes for package "${selectedPackage.name}" (target: ${targetClassCount})`);
        return assignments;
    }
    static async generateCrashCourseWeeklyRecurrenceAssignments(formData, selectedPackage, perClassAmount) {
        const currentUserId = await getCurrentUserId();
        const assignments = [];
        // Validate weekly days selection
        if (!formData.weekly_days || formData.weekly_days.length === 0) {
            throw new Error('Please select at least one day of the week');
        }
        // Use package class count, not formData.total_classes
        const targetClassCount = selectedPackage.class_count;
        // Calculate validity end date from start date + validity days
        let validityEndDate = null;
        if (selectedPackage.validity_days) {
            validityEndDate = new Date(formData.start_date);
            validityEndDate.setDate(validityEndDate.getDate() + selectedPackage.validity_days);
        }
        // Sort selected days to ensure proper chronological order
        const sortedWeeklyDays = [...formData.weekly_days].sort((a, b) => a - b);
        // Continue creating assignments until we hit the package class count or end date
        const startDate = new Date(formData.start_date);
        let classesCreated = 0;
        let currentWeekStart = new Date(startDate);
        // Find the start of the week (Sunday)
        currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());
        while (classesCreated < targetClassCount) {
            // For each week, create classes for all selected days
            for (const dayOfWeek of sortedWeeklyDays) {
                if (classesCreated >= targetClassCount) {
                    break;
                }
                const classDate = new Date(currentWeekStart);
                classDate.setDate(currentWeekStart.getDate() + dayOfWeek);
                // Skip if the class date is before the start date
                if (classDate < startDate) {
                    continue;
                }
                // Check if we've exceeded the validity period
                if (validityEndDate && classDate > validityEndDate) {
                    console.warn(`Reached validity end date (${validityEndDate.toISOString().split('T')[0]}). Created ${classesCreated} classes out of package requirement ${targetClassCount}.`);
                    return assignments;
                }
                const assignment = {
                    package_id: formData.package_id,
                    date: classDate.toISOString().split('T')[0],
                    start_time: formData.start_time,
                    end_time: formData.end_time,
                    instructor_id: formData.instructor_id,
                    payment_amount: perClassAmount,
                    schedule_type: 'crash', // Use 'crash' for crash course assignments
                    assigned_by: currentUserId,
                    booking_type: formData.booking_type || 'individual',
                    class_status: 'scheduled',
                    payment_status: 'pending',
                    instructor_status: 'pending'
                };
                // Add optional fields only if they have values
                if (formData.notes)
                    assignment.notes = formData.notes;
                if (formData.booking_id && formData.booking_id.trim() !== '' && formData.booking_id.trim() !== 'null' && formData.booking_id.trim() !== 'undefined') {
                    assignment.booking_id = formData.booking_id.trim();
                }
                if (formData.client_name)
                    assignment.client_name = formData.client_name;
                if (formData.client_email)
                    assignment.client_email = formData.client_email;
                assignments.push(assignment);
                classesCreated++;
            }
            // Move to next week
            currentWeekStart.setDate(currentWeekStart.getDate() + 7);
        }
        console.log(`Crash course assignment: Created ${assignments.length} classes for package "${selectedPackage.name}" (target: ${targetClassCount})`);
        return assignments;
    }
    static calculatePaymentAmount(formData, _assignmentType, classCount, studentCount) {
        const totalClasses = classCount || formData.total_classes;
        const actualStudentCount = studentCount || 1;
        switch (formData.payment_type) {
            case 'per_class':
                // Amount per class (as entered)
                return formData.payment_amount;
            case 'per_student_per_class':
                // Amount per student per class × students
                return formData.payment_amount * actualStudentCount;
            case 'per_member':
                // Monthly amount per member × students ÷ classes per month
                const classesPerMonth = totalClasses / Math.ceil(totalClasses / 4) || 1;
                return (formData.payment_amount * actualStudentCount) / classesPerMonth;
            case 'monthly':
                // Fixed monthly rate ÷ classes per month
                const avgClassesPerMonth = totalClasses / Math.ceil(totalClasses / 4) || 1;
                return formData.payment_amount / avgClassesPerMonth;
            case 'per_class_total':
                // Total amount for all students per class (as entered)
                return formData.payment_amount;
            case 'total_duration':
                // Total duration amount ÷ total classes
                return totalClasses > 0 ? formData.payment_amount / totalClasses : formData.payment_amount;
            default:
                return formData.payment_amount;
        }
    }
    static async updateBookingStatus(bookingId, status) {
        try {
            const { error } = await supabase
                .from('bookings')
                .update({ status })
                .eq('id', bookingId);
            if (error) {
                console.warn('Failed to update booking status:', error);
                // Don't throw error for booking status update failure
            }
        }
        catch (error) {
            console.warn('Failed to update booking status:', error);
        }
    }
}
