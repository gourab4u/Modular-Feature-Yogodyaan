import { useState, useEffect } from 'react';
import { supabase } from '../../../shared/lib/supabase';
export const useClassTypesAndPackages = () => {
    const [classTypes, setClassTypes] = useState([]);
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Fetch active class types
                const { data: classTypesData, error: classTypesError } = await supabase
                    .from('class_types')
                    .select('*')
                    .eq('is_active', true)
                    .eq('is_archived', false)
                    .order('name');
                if (classTypesError)
                    throw classTypesError;
                // Fetch active packages
                const { data: packagesData, error: packagesError } = await supabase
                    .from('class_packages')
                    .select('*')
                    .eq('is_active', true)
                    .eq('is_archived', false)
                    .order('name');
                if (packagesError)
                    throw packagesError;
                setClassTypes(classTypesData || []);
                setPackages(packagesData || []);
            }
            catch (err) {
                setError(err);
            }
            finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);
    return { classTypes, packages, loading, error };
};
