-- Create the store_visits table to track unique daily visitors
CREATE TABLE IF NOT EXISTS public.store_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL, -- UUID to match store identifiers
    telegram_user_id TEXT NOT NULL, -- Text to handle large Telegram IDs safely
    visited_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Add a unique constraint for (store_id, telegram_user_id, date)
-- This ensures we only log one visit per user per store per day
CREATE UNIQUE INDEX IF NOT EXISTS unique_visit_per_day 
ON public.store_visits (store_id, telegram_user_id, (visited_at::DATE));

-- Add RLS policies (optional but recommended)
ALTER TABLE public.store_visits ENABLE ROW LEVEL SECURITY;

-- Allow anonymous insertion (since tracking happens on client-side)
CREATE POLICY "Allow anonymous visit logs" 
ON public.store_visits FOR INSERT 
WITH CHECK (true);

-- Allow admins to read (you might want to restrict this to actual owners)
CREATE POLICY "Allow store owners to read visits" 
ON public.store_visits FOR SELECT 
USING (true); -- Simplified for now, can be narrowed down with store_id checks
