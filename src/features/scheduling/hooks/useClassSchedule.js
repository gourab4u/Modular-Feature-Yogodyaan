import { useEffect, useState } from 'react';
import { supabase } from '../../../shared/lib/supabase';
export function useClassSchedule() {
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const fetchSchedules = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log('🔍 Fetching class schedules...');
            // Method 1: Try with explicit foreign key references
            const { data: method1Data, error: method1Error } = await supabase
                .from('class_schedules')
                .select(`
          *,
          class_types!class_schedules_class_type_id_fkey(name, description, difficulty_level, price),
          profiles!class_schedules_instructor_id_fkey(full_name, email, user_id)
        `)
                .eq('is_active', true)
                .order('day_of_week')
                .order('start_time');
            if (!method1Error && method1Data) {
                console.log('✅ Method 1 (explicit FK) succeeded:', method1Data);
                setSchedules(processScheduleData(method1Data));
                return;
            }
            console.log('⚠️ Method 1 failed, trying Method 2:', method1Error);
            // Method 2: Try with column name aliases
            const { data: method2Data, error: method2Error } = await supabase
                .from('class_schedules')
                .select(`
          *,
          class_type:class_types!inner(name, description, difficulty_level, price),
          instructor:profiles!inner(full_name, email, user_id)
        `)
                .eq('is_active', true)
                .order('day_of_week')
                .order('start_time');
            if (!method2Error && method2Data) {
                console.log('✅ Method 2 (inner join) succeeded:', method2Data);
                setSchedules(processScheduleData(method2Data));
                return;
            }
            console.log('⚠️ Method 2 failed, trying Method 3:', method2Error);
            // Method 3: Try with simple aliases (most compatible)
            const { data: method3Data, error: method3Error } = await supabase
                .from('class_schedules')
                .select(`
          *,
          class_type:class_types(name, description, difficulty_level, price),
          instructor:profiles(full_name, email, user_id)
        `)
                .eq('is_active', true)
                .order('day_of_week')
                .order('start_time');
            if (!method3Error && method3Data) {
                console.log('✅ Method 3 (simple join) succeeded:', method3Data);
                setSchedules(processScheduleData(method3Data));
                return;
            }
            console.log('⚠️ All join methods failed, using fallback method');
            // Method 4: Fallback - fetch separately and combine
            const { data: scheduleData, error: scheduleError } = await supabase
                .from('class_schedules')
                .select('*')
                .eq('is_active', true)
                .order('day_of_week')
                .order('start_time');
            if (scheduleError) {
                throw new Error(`Failed to fetch schedules: ${scheduleError.message}`);
            }
            if (!scheduleData || scheduleData.length === 0) {
                console.log('📭 No active schedules found');
                setSchedules([]);
                return;
            }
            console.log('📊 Basic schedule data fetched:', scheduleData);
            // Fetch related data separately
            const combinedData = await fetchRelatedDataSeparately(scheduleData);
            setSchedules(combinedData);
        }
        catch (err) {
            console.error('❌ Error fetching class schedules:', err);
            setError(err.message);
        }
        finally {
            setLoading(false);
        }
    };
    const fetchRelatedDataSeparately = async (schedules) => {
        try {
            // Get unique IDs
            const classTypeIds = [...new Set(schedules.map(s => s.class_type_id).filter(Boolean))];
            const instructorIds = [...new Set(schedules.map(s => s.instructor_id).filter(Boolean))];
            console.log('🔗 Fetching related data - Class Types:', classTypeIds.length, 'Instructors:', instructorIds.length);
            // Fetch class types
            let classTypes = [];
            if (classTypeIds.length > 0) {
                const { data: classTypeData, error: classTypeError } = await supabase
                    .from('class_types')
                    .select('id, name, description, difficulty_level, price')
                    .in('id', classTypeIds);
                if (classTypeError) {
                    console.error('❌ Error fetching class types:', classTypeError);
                }
                else {
                    classTypes = classTypeData || [];
                    console.log('✅ Class types fetched:', classTypes.length);
                }
            }
            // Fetch instructors
            let instructors = [];
            if (instructorIds.length > 0) {
                const { data: instructorData, error: instructorError } = await supabase
                    .from('profiles')
                    .select('user_id, full_name, email')
                    .in('user_id', instructorIds);
                if (instructorError) {
                    console.error('❌ Error fetching instructors:', instructorError);
                }
                else {
                    instructors = instructorData || [];
                    console.log('✅ Instructors fetched:', instructors.length);
                }
            }
            // Combine the data
            const combinedSchedules = schedules.map(schedule => {
                const classType = classTypes.find(ct => ct.id === schedule.class_type_id) || {
                    name: 'Unknown Class',
                    description: 'Class details not available',
                    difficulty_level: 'beginner',
                    price: 0
                };
                const instructor = instructors.find(inst => inst.user_id === schedule.instructor_id) || {
                    full_name: 'TBD',
                    email: '',
                    user_id: schedule.instructor_id
                };
                return {
                    ...schedule,
                    class_type: classType,
                    instructor: instructor
                };
            });
            console.log('✅ Data combined successfully:', combinedSchedules.length, 'schedules');
            return combinedSchedules;
        }
        catch (error) {
            console.error('❌ Error in fetchRelatedDataSeparately:', error);
            return schedules.map(schedule => ({
                ...schedule,
                class_type: {
                    name: 'Error Loading Class',
                    description: 'Unable to load class details',
                    difficulty_level: 'beginner',
                    price: 0
                },
                instructor: {
                    full_name: 'Error Loading Instructor',
                    email: '',
                    user_id: schedule.instructor_id
                }
            }));
        }
    };
    const processScheduleData = (data) => {
        return data
            .filter(schedule => {
            // Filter out schedules with missing required data
            const hasValidClass = schedule.class_type || schedule.class_types;
            const hasValidInstructor = schedule.instructor || schedule.profiles;
            if (!hasValidClass || !hasValidInstructor) {
                console.warn('⚠️ Filtering out incomplete schedule:', schedule.id);
                return false;
            }
            return true;
        })
            .map(schedule => {
            // Normalize the data structure
            const classType = schedule.class_type || schedule.class_types;
            const instructor = schedule.instructor || schedule.profiles;
            return {
                ...schedule,
                class_type: {
                    name: classType?.name || 'Unknown Class',
                    description: classType?.description || '',
                    difficulty_level: classType?.difficulty_level || 'beginner',
                    price: classType?.price || 0
                },
                instructor: {
                    full_name: instructor?.full_name?.trim() || 'TBD',
                    email: instructor?.email || '',
                    user_id: instructor?.user_id || schedule.instructor_id
                }
            };
        });
    };
    useEffect(() => {
        fetchSchedules();
    }, []);
    const getDayName = (dayOfWeek) => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[dayOfWeek] || 'Invalid Day';
    };
    const formatTime = (time) => {
        try {
            return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        }
        catch (error) {
            console.error('Error formatting time:', time, error);
            return time;
        }
    };
    return {
        schedules,
        loading,
        error,
        refetch: fetchSchedules,
        getDayName,
        formatTime
    };
}
