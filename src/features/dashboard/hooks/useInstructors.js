import { useState, useEffect } from 'react';
import { supabase } from '../../../shared/lib/supabase';
export const useInstructors = () => {
    const [instructors, setInstructors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        const fetchInstructors = async () => {
            try {
                setLoading(true);
                // 1. Fetch user_ids from user_roles table
                const { data: roleData, error: roleError } = await supabase
                    .from('user_roles')
                    .select('user_id')
                    .in('role', ['instructor', 'yoga_acharya']);
                if (roleError)
                    throw roleError;
                const instructorIds = roleData?.map(r => r.user_id) || [];
                if (instructorIds.length === 0) {
                    setInstructors([]);
                    return;
                }
                // 2. Fetch user profiles based on the collected IDs
                const { data: usersData, error: usersError } = await supabase
                    .from('users')
                    .select('id, email, raw_user_meta_data')
                    .in('id', instructorIds);
                if (usersError)
                    throw usersError;
                if (usersData) {
                    const formattedInstructors = usersData.map((user) => ({
                        id: user.id,
                        email: user.email,
                        name: user.raw_user_meta_data?.name || 'Unnamed Instructor',
                    }));
                    setInstructors(formattedInstructors);
                }
                else {
                    setInstructors([]);
                }
            }
            catch (err) {
                setError(err);
            }
            finally {
                setLoading(false);
            }
        };
        fetchInstructors();
    }, []);
    return { instructors, loading, error };
};
