-- Add missing 'gender' column to products table
-- Run this in your Supabase SQL Editor

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS gender text;

-- Optional: Refresh PostgREST cache (usually happens automatically, but good to know)
-- NOTIFY pgrst, 'reload schema';
