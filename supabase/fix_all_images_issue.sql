-- 1. Ensure the column exists with correct type and default
ALTER TABLE products ADD COLUMN IF NOT EXISTS additional_images text[] DEFAULT '{}';

-- 2. Fix potential RLS issue: Ensure the public can ALWAYS see this column
-- (Run this if you have specific policies, otherwise the default 'select *' policy should handle it)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'products' AND policyname = 'Allow public read access'
    ) THEN
        CREATE POLICY "Allow public read access" ON products FOR SELECT USING (true);
    END IF;
END $$;

-- 3. Set a fallback for any existing products that might have NULL instead of {}
UPDATE products SET additional_images = '{}' WHERE additional_images IS NULL;
