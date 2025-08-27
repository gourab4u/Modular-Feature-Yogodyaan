import { useEffect, useState } from 'react';
import { supabase } from '../../../shared/lib/supabase';
/**
 * Hook to fetch the appropriate rate for a class assignment
 * based on schedule type and category
 */
export const useRateForAssignment = (scheduleType, category, classTypeId, packageId) => {
    const [rate, setRate] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    useEffect(() => {
        const fetchRate = async () => {
            if (!scheduleType || !category) {
                setRate(null);
                return;
            }
            try {
                setLoading(true);
                setError(null);
                const today = new Date().toISOString().split('T')[0];
                // Helper to run a concrete query
                const runQuery = async (filters) => {
                    let q = supabase
                        .from('instructor_rates')
                        .select('*')
                        .eq('schedule_type', scheduleType)
                        .eq('category', category)
                        .lte('effective_from', today)
                        .or(`effective_until.is.null,effective_until.gte.${today}`)
                        .eq('is_active', true);
                    if (!scheduleType || !category) {
                        console.error("Missing required filters: scheduleType or category");
                        return null;
                    }
                    for (const f of filters) {
                        if (f.isNull || f.v === null || f.v === '') {
                            // @ts-ignore
                            q = q.is(f.k, null);
                        }
                        else {
                            // @ts-ignore
                            q = q.eq(f.k, f.v);
                        }
                    }
                    const { data, error } = await q.order('created_at', { ascending: false }).limit(1).maybeSingle();
                    if (error && error.code !== 'PGRST116')
                        throw error; // ignore "no rows" error
                    return data;
                };
                // Priority: exact class_type -> exact package -> generic (both null)
                let found = null;
                if (classTypeId != null) {
                    found = await runQuery([{ k: 'class_type_id', v: classTypeId }, { k: 'package_id', v: null, isNull: true }]);
                }
                else if (packageId != null) {
                    found = await runQuery([{ k: 'package_id', v: packageId }, { k: 'class_type_id', v: null, isNull: true }]);
                }
                if (!found) {
                    found = await runQuery([{ k: 'class_type_id', v: null, isNull: true }, { k: 'package_id', v: null, isNull: true }]);
                }
                setRate(found || null);
            }
            catch (err) {
                setError(err);
                setRate(null);
            }
            finally {
                setLoading(false);
            }
        };
        fetchRate();
    }, [scheduleType, category, classTypeId, packageId]);
    return { rate, loading, error };
};
/**
 * Hook to fetch all available rates for dropdown/selection purposes
 */
export const useAvailableRates = () => {
    const [rates, setRates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        const fetchRates = async () => {
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from('instructor_rates')
                    .select('*')
                    .eq('is_active', true)
                    .order('schedule_type', { ascending: true })
                    .order('category', { ascending: true });
                if (error)
                    throw error;
                setRates(data || []);
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
    return { rates, loading, error };
};
