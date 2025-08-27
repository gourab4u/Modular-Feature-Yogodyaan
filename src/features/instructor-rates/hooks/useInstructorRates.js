import { useState, useEffect } from 'react';
import { supabase } from '../../../shared/lib/supabase';
export const useInstructorRates = (userId) => {
    const [rates, setRates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        const fetchRates = async () => {
            try {
                setLoading(true);
                // Fetch all generic rates
                const { data: ratesData, error: ratesError } = await supabase
                    .from('instructor_rates')
                    .select('*')
                    .order('schedule_type', { ascending: true })
                    .order('category', { ascending: true });
                if (ratesError)
                    throw ratesError;
                if (ratesData && ratesData.length > 0) {
                    // Get unique class type and package IDs
                    const classTypeIds = [...new Set(ratesData.map(rate => rate.class_type_id).filter(Boolean))];
                    const packageIds = [...new Set(ratesData.map(rate => rate.package_id).filter(Boolean))];
                    // Fetch class types if any exist
                    let classTypesMap = new Map();
                    if (classTypeIds.length > 0) {
                        const { data: classTypesData } = await supabase
                            .from('class_types')
                            .select('id, name, difficulty_level, price')
                            .in('id', classTypeIds);
                        if (classTypesData) {
                            classTypesMap = new Map(classTypesData.map(ct => [ct.id, ct]));
                        }
                    }
                    // Fetch packages if any exist
                    let packagesMap = new Map();
                    if (packageIds.length > 0) {
                        const { data: packagesData } = await supabase
                            .from('class_packages')
                            .select('id, name, type, course_type, price, class_count')
                            .in('id', packageIds);
                        if (packagesData) {
                            packagesMap = new Map(packagesData.map(pkg => [pkg.id, pkg]));
                        }
                    }
                    // Join the data manually
                    const formattedRates = ratesData.map((rate) => ({
                        ...rate,
                        class_types: rate.class_type_id ? classTypesMap.get(rate.class_type_id) : null,
                        class_packages: rate.package_id ? packagesMap.get(rate.package_id) : null,
                    }));
                    setRates(formattedRates);
                }
                else {
                    setRates([]);
                }
            }
            catch (err) {
                setError(err);
            }
            finally {
                setLoading(false);
            }
        };
        fetchRates();
    }, []);
    const addRate = async (rate) => {
        if (!userId)
            throw new Error("User must be logged in to add a rate");
        try {
            const { data, error } = await supabase
                .from('instructor_rates')
                .insert([{ ...rate, created_by: userId }])
                .select('*')
                .single();
            if (error)
                throw error;
            if (data) {
                // Fetch related class type or package data
                let classType = null;
                let classPackage = null;
                if (data.class_type_id) {
                    const { data: classTypeData } = await supabase
                        .from('class_types')
                        .select('id, name, difficulty_level, price')
                        .eq('id', data.class_type_id)
                        .single();
                    classType = classTypeData;
                }
                if (data.package_id) {
                    const { data: packageData } = await supabase
                        .from('class_packages')
                        .select('id, name, type, course_type, price, class_count')
                        .eq('id', data.package_id)
                        .single();
                    classPackage = packageData;
                }
                const newRate = {
                    ...data,
                    class_types: classType,
                    class_packages: classPackage,
                };
                setRates(prev => [...prev, newRate]);
            }
            return data;
        }
        catch (err) {
            setError(err);
            return null;
        }
    };
    const updateRate = async (rateId, updates) => {
        try {
            const { data, error } = await supabase
                .from('instructor_rates')
                .update(updates)
                .eq('id', rateId)
                .select('*')
                .single();
            if (error)
                throw error;
            if (data) {
                // Fetch related class type or package data
                let classType = null;
                let classPackage = null;
                if (data.class_type_id) {
                    const { data: classTypeData } = await supabase
                        .from('class_types')
                        .select('id, name, difficulty_level, price')
                        .eq('id', data.class_type_id)
                        .single();
                    classType = classTypeData;
                }
                if (data.package_id) {
                    const { data: packageData } = await supabase
                        .from('class_packages')
                        .select('id, name, type, course_type, price, class_count')
                        .eq('id', data.package_id)
                        .single();
                    classPackage = packageData;
                }
                const updatedRate = {
                    ...data,
                    class_types: classType,
                    class_packages: classPackage,
                };
                setRates(rates.map((r) => (r.id === rateId ? updatedRate : r)));
            }
            return data;
        }
        catch (err) {
            setError(err);
            return null;
        }
    };
    const deleteRate = async (rateId) => {
        try {
            const { error } = await supabase
                .from('instructor_rates')
                .delete()
                .eq('id', rateId);
            if (error)
                throw error;
            setRates(rates.filter((r) => r.id !== rateId));
            return true;
        }
        catch (err) {
            setError(err);
            return false;
        }
    };
    return { rates, loading, error, addRate, updateRate, deleteRate };
};
