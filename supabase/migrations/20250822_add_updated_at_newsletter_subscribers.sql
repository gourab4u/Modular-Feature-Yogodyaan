-- Migration: Add updated_at column to newsletter_subscribers
-- Purpose: Supabase client code updates `updated_at` on unsubscribe; ensure column exists.
-- Run with psql or supabase migrations tooling:
--   psql "<CONNECTION_STRING>" -f supabase/migrations/20250822_add_updated_at_newsletter_subscribers.sql
-- or use the Supabase SQL editor to execute this script.

BEGIN;

-- Add column if missing and default to current timestamp
ALTER TABLE public.newsletter_subscribers
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Backfill existing rows: set to now() if NULL (created_at not present in schema)
UPDATE public.newsletter_subscribers
SET updated_at = COALESCE(updated_at, now())
WHERE updated_at IS NULL;

COMMIT;
