import { useState, useEffect } from 'react';
import { supabase } from '../../../shared/lib/supabase';
export const useInstructorsList = () => {
    const [instructors, setInstructors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        const fetchInstructors = async () => {
            try {
                setLoading(true);
                const { data, error } = await supabase.rpc('get_instructors');
                if (error)
                    throw error;
                setInstructors(data || []);
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
