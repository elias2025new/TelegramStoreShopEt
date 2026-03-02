-- Add sizes column to products table as a text array
alter table public.products 
add column if not exists sizes text[] default '{}';

-- Update RLS if necessary (usually not needed for column additions unless specific logic applies)
