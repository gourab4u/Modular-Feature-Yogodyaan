import { useState, useEffect } from 'react';
import { supabase } from '../../../../../../shared/lib/supabase';
export const useClassAssignmentData = () => {
    const [assignments, setAssignments] = useState([]);
    const [weeklySchedules, setWeeklySchedules] = useState([]);
    const [scheduleTemplates, setScheduleTemplates] = useState([]);
    const [classTypes, setClassTypes] = useState([]);
    const [packages, setPackages] = useState([]);
    const [userProfiles, setUserProfiles] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingStates, setLoadingStates] = useState({
        creatingAssignment: false,
        updatingStatus: false,
        deletingAssignment: false,
        checkingConflicts: false,
        fetchingData: false
    });
    const fetchData = async () => {
        try {
            setLoading(true);
            setLoadingStates(prev => ({ ...prev, fetchingData: true }));
            // Execute all independent queries in parallel
            const [classTypesResult, packagesResult, rolesResult, assignmentsResult, weeklySchedulesResult, scheduleTemplatesResult, bookingsResult] = await Promise.all([
                supabase.from('class_types').select('id, name, difficulty_level'),
                supabase.from('class_packages').select('id, name, description, duration, price, class_count, validity_days, type, course_type, is_active').eq('is_active', true).eq('is_archived', false),
                supabase.from('roles').select('id, name').in('name', ['instructor', 'yoga_acharya']),
                supabase.from('class_assignments').select(`
                    *,
                    class_type:class_types(id, name, difficulty_level),
                    instructor_status,
                    instructor_response_at,
                    client_name,
                    client_email,
                    booking_id
                `).order('assigned_at', { ascending: false }),
                supabase.from('class_schedules').select('*').eq('is_active', true).order('day_of_week', { ascending: true }),
                supabase.from('class_schedules').select(`
                    *,
                    class_type:class_types(id, name, difficulty_level)
                `).eq('is_active', true).order('day_of_week', { ascending: true }).order('start_time', { ascending: true }),
                supabase.from('bookings').select(`
                    id,
                    user_id,
                    class_name,
                    instructor,
                    class_date,
                    class_time,
                    first_name,
                    last_name,
                    email,
                    phone,
                    status,
                    created_at,
                    booking_type,
                    class_packages(id, name, description, price, class_count, validity_days, type, duration, course_type)
                `).order('created_at', { ascending: false })
            ]);
            const classTypesData = classTypesResult.data || [];
            const packagesData = packagesResult.data || [];
            const roles = rolesResult.data || [];
            const assignmentsData = assignmentsResult.data || [];
            const weeklySchedulesData = weeklySchedulesResult.data || [];
            const scheduleTemplatesData = scheduleTemplatesResult.data || [];
            const bookingsData = bookingsResult.data || [];
            // Create maps for efficient lookups
            const classTypeMap = new Map(classTypesData.map(ct => [ct.id, ct]));
            // Now fetch user roles and profiles based on role data
            const roleIds = roles.map(r => r.id);
            if (roleIds.length === 0) {
                // No instructor roles found, return empty data
                setClassTypes(classTypesData);
                setPackages(packagesData);
                setUserProfiles([]);
                setAssignments([]);
                setWeeklySchedules([]);
                setScheduleTemplates([]);
                setBookings(bookingsData.map(booking => ({
                    ...booking,
                    class_packages: Array.isArray(booking.class_packages) && booking.class_packages.length > 0
                        ? booking.class_packages[0]
                        : null
                })));
                return;
            }
            // First get user roles
            const { data: userRoles } = await supabase
                .from('user_roles')
                .select('user_id, role_id')
                .in('role_id', roleIds);
            // Then get profiles for those users
            const userIds = [...new Set((userRoles || []).map(ur => ur.user_id))];
            const { data: profiles } = userIds.length > 0
                ? await supabase.from('profiles').select('user_id, full_name, email').in('user_id', userIds)
                : { data: [] };
            // Build profiles with roles more efficiently
            const userRoleMap = new Map();
            (userRoles || []).forEach(ur => {
                if (!userRoleMap.has(ur.user_id)) {
                    userRoleMap.set(ur.user_id, []);
                }
                userRoleMap.get(ur.user_id)?.push(ur.role_id);
            });
            const roleMap = new Map(roles.map(role => [role.id, role.name]));
            const profilesWithRoles = (profiles || []).map(profile => ({
                ...profile,
                user_roles: (userRoleMap.get(profile.user_id) || [])
                    .map(roleId => ({ roles: { name: roleMap.get(roleId) || '' } }))
                    .filter(role => role.roles.name)
            }));
            // Build lookup maps for better performance
            const profileMap = new Map(profilesWithRoles.map(p => [p.user_id, p]));
            // Enrich data more efficiently
            const enrichedAssignments = assignmentsData.map(assignment => ({
                ...assignment,
                class_type: classTypeMap.get(assignment.class_type_id),
                instructor_profile: profileMap.get(assignment.instructor_id)
            }));
            const enrichedWeeklySchedules = weeklySchedulesData.map(schedule => ({
                ...schedule,
                class_type: classTypeMap.get(schedule.class_type_id),
                instructor_profile: profileMap.get(schedule.instructor_id)
            }));
            const enrichedBookings = bookingsData.map(booking => ({
                ...booking,
                // Supabase returns class_packages as array, but we expect single object
                class_packages: Array.isArray(booking.class_packages) && booking.class_packages.length > 0
                    ? booking.class_packages[0]
                    : null
            }));
            // Update state
            setClassTypes(classTypesData);
            setPackages(packagesData);
            setUserProfiles(profilesWithRoles);
            setAssignments(enrichedAssignments);
            setWeeklySchedules(enrichedWeeklySchedules);
            setScheduleTemplates(scheduleTemplatesData);
            setBookings(enrichedBookings);
        }
        catch (e) {
            console.error('Fetch error:', e);
        }
        finally {
            setLoading(false);
            setLoadingStates(prev => ({ ...prev, fetchingData: false }));
        }
    };
    useEffect(() => {
        fetchData();
    }, []);
    return {
        assignments,
        setAssignments,
        weeklySchedules,
        setWeeklySchedules,
        scheduleTemplates,
        setScheduleTemplates,
        classTypes,
        setClassTypes,
        packages,
        setPackages,
        userProfiles,
        setUserProfiles,
        bookings,
        setBookings,
        loading,
        setLoading,
        loadingStates,
        setLoadingStates,
        fetchData,
        refetch: fetchData
    };
};
