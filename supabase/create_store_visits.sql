-- Create the store_visits table to track unique daily visitors
CREATE TABLE IF NOT EXISTS public.store_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL, 
    telegram_user_id TEXT NOT NULL,
    visit_date DATE DEFAULT CURRENT_DATE NOT NULL, -- Dedicated date column for reliable indexing
    visited_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(store_id, telegram_user_id, visit_date)
);

-- Add index on visited_at for fast KPI counting (Today/Week stats)
CREATE INDEX IF NOT EXISTS idx_store_visits_visited_at ON public.store_visits (visited_at);

-- Add RLS policies
ALTER TABLE public.store_visits ENABLE ROW LEVEL SECURITY;

-- Allow anonymous insertion
CREATE POLICY "Allow anonymous visit logs v2" 
ON public.store_visits FOR INSERT 
WITH CHECK (true);

-- Allow everyone to read (needed for stats calculation)
CREATE POLICY "Allow visit reads v2" 
ON public.store_visits FOR SELECT 
USING (true);
