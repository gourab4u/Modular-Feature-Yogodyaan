import { useEffect, useState } from 'react';
import { supabase } from '../../../shared/lib/supabase';
export function useUserProfiles() {
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const fetchProfiles = async () => {
        try {
            setLoading(true);
            setError(null);
            // First try to use the RPC function if it exists
            const { data: rpcData, error: rpcError } = await supabase
                .rpc('get_user_profiles_for_admin');
            if (!rpcError && rpcData) {
                setProfiles(rpcData);
                return;
            }
            // Fallback: fetch profiles and user roles separately
            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });
            if (profilesError)
                throw profilesError;
            // Fetch user roles separately
            const { data: userRolesData, error: userRolesError } = await supabase
                .from('user_roles')
                .select(`
          user_id,
          roles(name)
        `);
            if (userRolesError)
                throw userRolesError;
            // Transform the data to match the expected format
            const transformedData = (profilesData || []).map(profile => {
                // Find roles for this user
                const userRoleEntries = (userRolesData || []).filter(ur => ur.user_id === profile.user_id);
                const userRoles = userRoleEntries.map(ur => ur.roles?.name).filter(Boolean);
                // If no roles found, default to 'user'
                if (userRoles.length === 0) {
                    userRoles.push('user');
                }
                return {
                    ...profile,
                    user_id: profile.user_id || profile.id,
                    experience_level: profile.role || 'user',
                    user_created_at: profile.created_at,
                    total_bookings: 0,
                    attended_classes: 0,
                    articles_viewed: 0,
                    user_roles: userRoles
                };
            });
            setProfiles(transformedData);
        }
        catch (err) {
            console.error('Error fetching user profiles:', err);
            setError(err.message || 'Failed to load user profiles');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchProfiles();
    }, []);
    return {
        profiles,
        loading,
        error,
        refetch: fetchProfiles
    };
}
