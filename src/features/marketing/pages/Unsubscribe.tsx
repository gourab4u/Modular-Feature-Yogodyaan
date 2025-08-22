import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../shared/lib/supabase';

type State = 'idle' | 'processing' | 'done' | 'error'

function decodeToken(token: string): { id: string; ts: number } | null {
    try {
        const decoded = atob(token)
        const [id, tsStr] = decoded.split(':')
        const ts = Number(tsStr)
        if (!id || Number.isNaN(ts)) return null
        // Basic UUID v4 format check (lenient)
        const uuidRe = /^[0-9a-fA-F-]{32,36}$/
        if (!uuidRe.test(id)) return null
        return { id, ts }
    } catch (_) {
        return null
    }
}

export default function Unsubscribe() {
    const [state, setState] = useState<State>('idle')
    const [message, setMessage] = useState<string>('')

    const token = useMemo(() => {
        const raw = new URLSearchParams(window.location.search).get('token') || ''
        try {
            return decodeURIComponent(raw)
        } catch {
            return raw
        }
    }, [])

    useEffect(() => {
        async function run() {
            if (!token) {
                setState('error')
                setMessage('Invalid unsubscribe link.')
                return
            }

            setState('processing')
            const parsed = decodeToken(token)
            if (!parsed) {
                setState('error')
                setMessage('Invalid unsubscribe token.')
                return
            }

            // Optional expiry: 90 days
            const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000
            if (Date.now() - parsed.ts > ninetyDaysMs) {
                setState('error')
                setMessage('This unsubscribe link has expired.')
                return
            }

            // Attempt to update subscriber status (try with updated_at, fall back if column missing)
            let updateError: any = null
            try {
                const { error } = await supabase
                    .from('newsletter_subscribers')
                    .update({ status: 'unsubscribed', updated_at: new Date().toISOString() })
                    .eq('id', parsed.id)

                updateError = error

                // If schema is missing updated_at column, retry without it
                if (updateError && /updated_at/i.test(String((updateError as any).message || updateError))) {
                    const { error: retryError } = await supabase
                        .from('newsletter_subscribers')
                        .update({ status: 'unsubscribed' })
                        .eq('id', parsed.id)
                    updateError = retryError
                }
            } catch (e) {
                updateError = e
            }

            if (updateError) {
                // Log detailed supabase error for debugging (stringify to capture nested props)
                console.error('Unsubscribe update failed:', updateError)
                try {
                    console.error('Unsubscribe error (stringified):', JSON.stringify(updateError))
                } catch (_) {
                    // ignore stringify errors
                }
                setState('error')
                setMessage('We could not process your unsubscribe at the moment. Please try again later.')
                return
            }

            setState('done')
            setMessage('You have been unsubscribed from future newsletters. You can re-subscribe anytime from our website.')
        }

        run()
    }, [token])

    return (
        <div className="min-h-[60vh] flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center">
                <h1 className="text-2xl font-semibold mb-3">Email Preferences</h1>
                {state === 'processing' && <p className="text-slate-600 dark:text-slate-300">Processing your request…</p>}
                {state !== 'processing' && <p className="text-slate-700 dark:text-slate-200">{message}</p>}
                <a className="inline-block mt-6 text-indigo-600 hover:text-indigo-700" href="/">Return to Home</a>
            </div>
        </div>
    )
}
