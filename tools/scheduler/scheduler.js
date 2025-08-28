#!/usr/bin/env node
/**
 * Scheduler: find classes starting in HOURS_BEFORE hours (± WINDOW_MINUTES)
 * and call the Supabase Edge Function with { classId }.
 *
 * Env vars required:
 *  SUPABASE_URL
 *  SUPABASE_SERVICE_ROLE_KEY
 *  EDGE_FUNCTION_URL
 * Optional:
 *  HOURS_BEFORE (default 12)
 *  WINDOW_MINUTES (default 5)
 *  SCHEDULER_SECRET_HEADER & SCHEDULER_SECRET_TOKEN (optional header to secure edge fn)
 */
import { DateTime } from 'luxon';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
// prefer an anon/public key for gateway forwarding (can be set as SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY)
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || null;
const EDGE_FN = process.env.EDGE_FUNCTION_URL;
const HOURS_BEFORE = parseInt(process.env.HOURS_BEFORE || '12', 10);
const WINDOW_MINUTES = parseInt(process.env.WINDOW_MINUTES || '5', 10);

if (!SUPABASE_URL || !SUPABASE_KEY || !EDGE_FN) {
    console.error('Missing required env vars. SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and EDGE_FUNCTION_URL are required.');
    process.exit(1);
}

async function fetchUpcomingClasses() {
    const now = DateTime.utc();
    const max = now.plus({ days: 2 }); // fetch the next 48 hours as candidates
    const url = `${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/class_assignments?select=id,assignment_code,date,start_time,timezone,zoom_meeting&zoom_meeting=is.null&date=gte.${now.toISODate()}&date=lte.${max.toISODate()}`;
    const res = await fetch(url, {
        headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
        },
    });
    if (!res.ok) throw new Error(`Supabase fetch failed: ${res.status}`);
    return res.json();
}

async function callEdge(classId) {
    const headers = { 'Content-Type': 'application/json' };
    // Add gateway-accepted Authorization header when anon key is available
    if (SUPABASE_ANON_KEY) {
        headers['Authorization'] = `Bearer ${SUPABASE_ANON_KEY}`;
    }
    if (process.env.SCHEDULER_SECRET_HEADER && process.env.SCHEDULER_SECRET_TOKEN) {
        headers[process.env.SCHEDULER_SECRET_HEADER] = process.env.SCHEDULER_SECRET_TOKEN;
    }
    // non-sensitive debug: print header keys and masked values (do not print full secrets)
    try {
        const masked = {};
        Object.keys(headers).forEach((k) => {
            const v = String(headers[k] || '');
            if (/auth|secret|token/i.test(k)) {
                masked[k] = v.length > 8 ? `${v.slice(0, 4)}...${v.slice(-4)}` : '***';
            } else {
                masked[k] = v;
            }
        });
        console.log('calling edge', EDGE_FN, 'headers keys:', Object.keys(headers));
        console.log('calling edge masked headers:', JSON.stringify(masked));
    } catch (e) {
        // ignore logging errors
    }
    const resp = await fetch(EDGE_FN, { method: 'POST', headers, body: JSON.stringify({ classId }) });
    const text = await resp.text().catch(() => '');
    return { status: resp.status, body: text };
}

async function run() {
    console.log(new Date().toISOString(), 'scheduler start');
    // non-sensitive debug: confirm whether required envs are present in the process
    console.log('env presence:', 'EDGE_FUNCTION_URL=', !!process.env.EDGE_FUNCTION_URL, 'SCHEDULER_SECRET_HEADER=', !!process.env.SCHEDULER_SECRET_HEADER, 'SCHEDULER_SECRET_TOKEN=', !!process.env.SCHEDULER_SECRET_TOKEN);
    // non-sensitive check: detect accidental equality or header-like values (do NOT print secret values)
    try {
        const headerRaw = process.env.SCHEDULER_SECRET_HEADER || '';
        const tokenRaw = process.env.SCHEDULER_SECRET_TOKEN || '';
        const looksLikeHeader = (s) => /^x[-_]/i.test(String(s));
        console.log('debug: header===token?', headerRaw === tokenRaw, 'headerLooksLikeHeader?', looksLikeHeader(headerRaw), 'tokenLooksLikeHeader?', looksLikeHeader(tokenRaw));
    } catch (e) { }
    const now = DateTime.utc();
    const classes = await fetchUpcomingClasses();
    console.log('candidates:', (classes || []).length);

    for (const c of classes || []) {
        try {
            if (!c?.date || !c?.start_time) {
                console.log('skipping candidate (missing date/start_time)', c?.id);
                continue;
            }
            const classZone = c.timezone || 'UTC';
            const classDt = DateTime.fromISO(`${c.date}T${c.start_time}`, { zone: classZone });
            if (!classDt.isValid) {
                console.log('skipping candidate (invalid class datetime)', c.id, c.date, c.start_time, classZone);
                continue;
            }

            const minutesUntil = Math.round(classDt.toUTC().diff(now, 'minutes').minutes);
            const target = HOURS_BEFORE * 60;

            // verbose debug output to diagnose why candidates are not invoked
            console.log(`candidate ${c.id}: assignment_code=${c.assignment_code || ''} date=${c.date} start_time=${c.start_time} timezone=${classZone}`);
            console.log(`  classDt (ISO): ${classDt.toISO()} | minutesUntil: ${minutesUntil} | target: ${target} (+/- ${WINDOW_MINUTES})`);

            const force = String(process.env.FORCE_INVOKE || '').toLowerCase();
            const isForced = force === '1' || force === 'true';
            if (isForced) {
                console.log(`  FORCE_INVOKE enabled — invoking edge for ${c.id}`);
                const r = await callEdge(c.id);
                console.log('  edge response', r.status, r.body);
                continue;
            }

            if (minutesUntil >= target - WINDOW_MINUTES && minutesUntil <= target + WINDOW_MINUTES) {
                console.log(`Invoking edge for ${c.id} (starts in ${minutesUntil} minutes) assignment_code=${c.assignment_code}`);
                const r = await callEdge(c.id);
                console.log('edge response', r.status, r.body);
            } else {
                console.log(`  skipping (not within window) for ${c.id} — starts in ${minutesUntil} minutes`);
            }
        } catch (err) {
            console.error('error processing class', c?.id, String(err));
        }
    }

    console.log(new Date().toISOString(), 'scheduler done');
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
