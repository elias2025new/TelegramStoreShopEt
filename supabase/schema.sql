-- Create products table
create table public.products (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  name text not null,
  description text null,
  price numeric not null,
  image_url text null,
  category text null,
  constraint products_pkey primary key (id)
);

-- Enable RLS
alter table public.products enable row level security;

-- Create policies
create policy "Public products are viewable by everyone."
  on public.products for select
  using ( true );

-- (Optional) Policy for admin to insert/update/delete 
-- assuming we want to allow anyone for now for development or user will use dashboard
-- create policy "Users can insert their own products." on public.products for insert with check ( auth.uid() = user_id );

-- Storage bucket setup (run this in Storage > Buckets)
-- Create a public bucket named 'products'
-- Policy: "Give public access to products" -> SELECT (true)
-- Policy: "Allow authenticated uploads" -> INSERT (auth.role() = 'authenticated')
