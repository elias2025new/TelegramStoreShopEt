-- SQL script to update the products table stock column to jsonb
-- Run this in your Supabase SQL Editor

-- Check if the column is already jsonb to avoid errors
DO $$ 
BEGIN
    IF (SELECT data_type FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'stock') != 'jsonb' THEN
        
        -- Drop the default value first because it cannot be automatically cast to jsonb
        ALTER TABLE public.products ALTER COLUMN stock DROP DEFAULT;
        
        -- Alter the column type and migrate existing data
        -- Existing numeric stock will be converted to {"Total": value}
        ALTER TABLE public.products 
        ALTER COLUMN stock TYPE jsonb USING 
            CASE 
                WHEN stock IS NULL THEN NULL 
                ELSE jsonb_build_object('Total', stock) 
            END;
            
        -- Optionally set a new JSONB-compatible default
        ALTER TABLE public.products ALTER COLUMN stock SET DEFAULT '{}'::jsonb;
            
        RAISE NOTICE 'Successfully converted stock column to jsonb';
    ELSE
        RAISE NOTICE 'Stock column is already jsonb';
    END IF;
END $$;
