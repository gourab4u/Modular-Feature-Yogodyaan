import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const SettingsContext = createContext<any>(null)

export const useSettings = () => useContext(SettingsContext)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<any>({})
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true
            ; (async () => {
                try {
                    const { data } = await supabase.from('business_settings').select('key, value')
                    if (!mounted || !data) return
                    const mapped: any = {}
                    data.forEach((r: any) => (mapped[r.key] = r.value))
                    setSettings(mapped)
                } catch (e) {
                    console.error('Failed to load settings', e)
                } finally {
                    if (mounted) setLoading(false)
                }
            })()
        return () => { mounted = false }
    }, [])

    const refresh = async () => {
        try {
            const { data } = await supabase.from('business_settings').select('key, value')
            const mapped: any = {}
            data?.forEach((r: any) => (mapped[r.key] = r.value))
            setSettings(mapped)
        } catch (e) {
            console.error('Failed to refresh settings', e)
        }
    }

    return (
        <SettingsContext.Provider value={{ settings, loading, refresh }}>
            {children}
        </SettingsContext.Provider>
    )
}

export default SettingsContext
