import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
const SettingsContext = createContext(null);
export const useSettings = () => useContext(SettingsContext);
export function SettingsProvider({ children }) {
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const { data } = await supabase.from('business_settings').select('key, value');
                if (!mounted || !data)
                    return;
                const mapped = {};
                data.forEach((r) => (mapped[r.key] = r.value));
                setSettings(mapped);
            }
            catch (e) {
                console.error('Failed to load settings', e);
            }
            finally {
                if (mounted)
                    setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, []);
    const refresh = async () => {
        try {
            const { data } = await supabase.from('business_settings').select('key, value');
            const mapped = {};
            data?.forEach((r) => (mapped[r.key] = r.value));
            setSettings(mapped);
        }
        catch (e) {
            console.error('Failed to refresh settings', e);
        }
    };
    return (_jsx(SettingsContext.Provider, { value: { settings, loading, refresh }, children: children }));
}
export default SettingsContext;
