import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../shared/lib/supabase';
export function useClassAssignments(instructorId, status = 'all', dateRange) {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const fetchAssignments = useCallback(async () => {
        if (!instructorId) {
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            setError(null);
            console.log('Fetching assignments for instructor:', instructorId);
            console.log('Date range filter:', dateRange);
            // Fetch both adhoc assignments and weekly schedules in parallel
            const [assignmentsRes, schedulesRes] = await Promise.all([
                // Fetch adhoc assignments
                supabase
                    .from('class_assignments')
                    .select(`
            *,
            class_types (
              id,
              name,
              description,
              difficulty_level,
              duration_minutes
            ),
            class_schedules (
              id,
              day_of_week,
              start_time,
              duration_minutes
            )
          `)
                    .eq('instructor_id', instructorId)
                    .order('date', { ascending: false }),
                // Fetch weekly schedules
                supabase
                    .from('class_schedules')
                    .select(`
            *,
            class_types (
              id,
              name,
              description,
              difficulty_level,
              duration_minutes
            )
          `)
                    .eq('instructor_id', instructorId)
                    .eq('is_active', true)
                    .order('day_of_week')
                    .order('start_time')
            ]);
            if (assignmentsRes.error) {
                console.error('Assignments query error:', assignmentsRes.error);
                throw assignmentsRes.error;
            }
            if (schedulesRes.error) {
                console.error('Schedules query error:', schedulesRes.error);
                throw schedulesRes.error;
            }
            console.log('Raw fetched assignments:', assignmentsRes.data);
            console.log('Raw fetched schedules:', schedulesRes.data);
            // Transform weekly schedules to match assignment format
            const transformedSchedules = (schedulesRes.data || []).map(schedule => ({
                ...schedule,
                // Add fields to distinguish from adhoc assignments
                schedule_type: 'weekly',
                instructor_status: 'accepted', // Weekly schedules are pre-accepted
                class_status: 'scheduled',
                payment_status: 'pending',
                // Generate a date field for current week instances (for display purposes)
                date: getNextOccurrence(schedule.day_of_week),
                start_time: schedule.start_time,
                end_time: addMinutesToTime(schedule.start_time, schedule.duration_minutes),
                payment_amount: 0, // Weekly schedules might not have individual payment amounts
                notes: `Weekly recurring class - ${getDayName(schedule.day_of_week)}s at ${formatTime(schedule.start_time)}`,
                assigned_at: schedule.created_at || new Date().toISOString(),
                assigned_by: 'system', // Weekly schedules are system-assigned
                class_types: schedule.class_types
            }));
            // Combine and sort all assignments
            const allAssignments = [
                ...(assignmentsRes.data || []),
                ...transformedSchedules
            ];
            // Apply date range filter if provided
            let filteredAssignments = allAssignments;
            if (dateRange && dateRange.from && dateRange.to) {
                const fromDate = dateRange.from.toISOString().split('T')[0];
                const toDate = dateRange.to.toISOString().split('T')[0];
                console.log('Applying date filter:', fromDate, 'to', toDate);
                filteredAssignments = allAssignments.filter(assignment => {
                    if (assignment.date) {
                        return assignment.date >= fromDate && assignment.date <= toDate;
                    }
                    return true;
                });
            }
            else {
                console.log('No date range filter applied - showing all assignments');
            }
            console.log('Combined assignments count:', allAssignments.length);
            console.log('Filtered assignments count:', filteredAssignments.length);
            console.log('Weekly schedules transformed:', transformedSchedules.length);
            setAssignments(filteredAssignments);
        }
        catch (err) {
            console.error('Error fetching assignments:', err);
            setError(err.message);
        }
        finally {
            setLoading(false);
        }
    }, [instructorId, status, dateRange]);
    // Helper functions for weekly schedules
    const getNextOccurrence = (dayOfWeek) => {
        const today = new Date();
        const todayDayOfWeek = today.getDay();
        const daysUntilNext = (dayOfWeek - todayDayOfWeek + 7) % 7;
        const nextOccurrence = new Date(today);
        nextOccurrence.setDate(today.getDate() + (daysUntilNext === 0 ? 7 : daysUntilNext));
        return nextOccurrence.toISOString().split('T')[0];
    };
    const addMinutesToTime = (timeString, minutes) => {
        const [hours, mins] = timeString.split(':').map(Number);
        const totalMinutes = hours * 60 + mins + minutes;
        const newHours = Math.floor(totalMinutes / 60) % 24;
        const newMins = totalMinutes % 60;
        return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
    };
    const getDayName = (dayOfWeek) => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[dayOfWeek];
    };
    const formatTime = (timeString) => {
        if (!timeString)
            return '';
        const [hours, minutes] = timeString.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes);
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };
    const updateAssignmentStatus = async (assignmentId, action, data) => {
        try {
            // Check if this is a weekly schedule (they can't be updated the same way)
            const assignment = assignments.find(a => a.id === assignmentId);
            if (assignment?.schedule_type === 'weekly') {
                console.log('Cannot update status of weekly schedule - these are pre-accepted recurring classes');
                throw new Error('Weekly schedules cannot be rejected or rescheduled. Please contact admin to modify weekly schedules.');
            }
            let updateData = {
                instructor_response_at: new Date().toISOString()
            };
            switch (action) {
                case 'accept':
                    updateData.instructor_status = 'accepted';
                    if (data?.instructor_remarks) {
                        updateData.instructor_remarks = data.instructor_remarks;
                    }
                    break;
                case 'reject':
                    console.log('Processing reject request with data:', data);
                    updateData.instructor_status = 'rejected';
                    if (data?.rejection_reason) {
                        updateData.rejection_reason = data.rejection_reason;
                    }
                    if (data?.instructor_remarks) {
                        updateData.instructor_remarks = data.instructor_remarks;
                    }
                    console.log('Reject update data:', updateData);
                    break;
                case 'reschedule':
                    console.log('Processing reschedule request with data:', data);
                    updateData.instructor_status = 'rescheduled';
                    if (data?.reschedule_requested_date) {
                        updateData.reschedule_requested_date = data.reschedule_requested_date;
                    }
                    if (data?.reschedule_requested_time) {
                        updateData.reschedule_requested_time = data.reschedule_requested_time;
                    }
                    if (data?.reschedule_reason) {
                        updateData.reschedule_reason = data.reschedule_reason;
                    }
                    if (data?.instructor_remarks) {
                        updateData.instructor_remarks = data.instructor_remarks;
                    }
                    console.log('Reschedule update data:', updateData);
                    break;
            }
            const { error: updateError } = await supabase
                .from('class_assignments')
                .update(updateData)
                .eq('id', assignmentId);
            if (updateError) {
                console.error('Database update error:', updateError);
                throw updateError;
            }
            console.log('Database update successful for assignment:', assignmentId);
            // Update local state
            setAssignments(prev => {
                const updated = prev.map(assignment => assignment.id === assignmentId
                    ? { ...assignment, ...updateData }
                    : assignment);
                console.log('Local state updated. Assignment with ID', assignmentId, 'now has status:', updated.find(a => a.id === assignmentId)?.instructor_status);
                return updated;
            });
            return { success: true };
        }
        catch (err) {
            console.error('Error updating assignment:', err);
            throw err;
        }
    };
    const markClassCompleted = async (assignmentId, remarks) => {
        try {
            const updateData = {
                class_status: 'completed',
                updated_at: new Date().toISOString()
            };
            if (remarks) {
                updateData.instructor_remarks = remarks;
            }
            const { error } = await supabase
                .from('class_assignments')
                .update(updateData)
                .eq('id', assignmentId);
            if (error) {
                throw error;
            }
            // Update local state
            setAssignments(prev => prev.map(assignment => assignment.id === assignmentId
                ? { ...assignment, ...updateData }
                : assignment));
            return { success: true };
        }
        catch (err) {
            console.error('Error marking class completed:', err);
            throw err;
        }
    };
    useEffect(() => {
        fetchAssignments();
    }, [fetchAssignments]);
    return {
        assignments,
        loading,
        error,
        refetch: fetchAssignments,
        updateAssignmentStatus,
        markClassCompleted
    };
}
