import { useState, useEffect } from 'react';
import { supabase } from '../../../shared/lib/supabase';
import { InstructorRate, CategoryType } from '../types/rate';

export interface RateForAssignment {
  rate: InstructorRate | null;
  loading: boolean;
  error: any;
}

/**
 * Hook to fetch the appropriate rate for a class assignment
 * based on schedule type and category
 */
export const useRateForAssignment = (
  scheduleType?: string,
  category?: CategoryType,
  classTypeId?: string
): RateForAssignment => {
  const [rate, setRate] = useState<InstructorRate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const fetchRate = async () => {
      if (!scheduleType || !category) {
        setRate(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Build query to find matching rate
        let query = supabase
          .from('instructor_rates')
          .select('*')
          .eq('schedule_type', scheduleType)
          .eq('category', category)
          .eq('is_active', true);

        // Add date filtering to get current rates
        const today = new Date().toISOString().split('T')[0];
        query = query
          .lte('effective_from', today)
          .or(`effective_until.is.null,effective_until.gte.${today}`);

        // If class type is specified, prefer rates for that class type
        if (classTypeId) {
          query = query.order('class_type_id', { ascending: false }); // NULL values last
        }

        // Order by creation date to get the most recent rate
        query = query.order('created_at', { ascending: false });

        const { data, error } = await query.limit(1).single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          throw error;
        }

        setRate(data || null);
      } catch (err) {
        setError(err);
        setRate(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRate();
  }, [scheduleType, category, classTypeId]);

  return { rate, loading, error };
};

/**
 * Hook to fetch all available rates for dropdown/selection purposes
 */
export const useAvailableRates = () => {
  const [rates, setRates] = useState<InstructorRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

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

        if (error) throw error;
        setRates(data || []);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRates();
  }, []);

  return { rates, loading, error };
};