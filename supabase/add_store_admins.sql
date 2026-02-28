-- ============================================
-- Add Multiple Admin Support: Run this in Supabase SQL Editor
-- ============================================

-- 1. Create store_admins table
create table if not exists public.store_admins (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  store_id uuid references public.stores(id) on delete cascade,
  telegram_id bigint not null,
  constraint store_admins_pkey primary key (id),
  constraint store_admins_unique_admin unique (store_id, telegram_id)
);

-- 2. Enable RLS
alter table public.store_admins enable row level security;

-- 3. Allow everyone to read (for auth check in the app)
create policy "Store admins are viewable by everyone"
  on public.store_admins for select
  using ( true );

-- 4. Add your second admin user ID
-- This script automatically finds your store ID and adds the new admin.
insert into public.store_admins (store_id, telegram_id)
select id, 6167606109 from public.stores 
limit 1
on conflict (store_id, telegram_id) do nothing;
