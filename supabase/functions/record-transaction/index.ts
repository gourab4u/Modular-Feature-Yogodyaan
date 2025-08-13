/* eslint-disable */
/* @ts-nocheck */
/*
  Record Transaction Edge Function

  Purpose:
  - Inserts a row into public.transactions using service role.
  - Verifies the requester has an allowed role.

  Env Vars required:
  - SUPABASE_URL
  - SUPABASE_SERVICE_ROLE_KEY
  - SUPABASE_ANON_KEY
*/
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
};

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        // Explicit 200 OK for preflight
        return new Response('ok', { status: 200, headers: corsHeaders });
    }

    try {
        if (req.method !== 'POST') {
            return new Response(JSON.stringify({ error: 'Method not allowed' }), {
                status: 405,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            global: { headers: { Authorization: authHeader } },
        });

        // Verify user and role
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();
        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const { data: userRoles, error: roleError } = await supabase
            .from('user_roles')
            .select(`roles(name)`)
            .eq('user_id', user.id);

        if (roleError) {
            console.error('Error checking user roles:', roleError);
            return new Response(JSON.stringify({ error: 'Error verifying permissions' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const allowedRoles = ['super_admin', 'super_user', 'energy_exchange_lead'];
        const hasAccess = userRoles?.some((ur: any) => allowedRoles.includes(ur.roles?.name));
        if (!hasAccess) {
            return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Parse payload
        const body = await req.json().catch(() => ({}));
        const {
            user_id = null,
            subscription_id = null,
            amount,
            currency = 'USD',
            status = 'pending',
            payment_method = null,
            stripe_payment_intent_id = null,
            description = null,
        } = body || {};

        if (typeof amount !== 'number') {
            return new Response(JSON.stringify({ error: 'Invalid amount' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Insert into transactions via service role (bypasses RLS)
        const { data: inserted, error: insertError } = await supabaseAdmin
            .from('transactions')
            .insert({
                user_id,
                subscription_id,
                amount,
                currency,
                status,
                payment_method,
                stripe_payment_intent_id,
                description,
            })
            .select('*')
            .single();

        if (insertError) {
            console.error('Insert error:', insertError);
            return new Response(JSON.stringify({ error: 'Insert failed' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        return new Response(JSON.stringify(inserted), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (e) {
        console.error('Unexpected error:', e);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
