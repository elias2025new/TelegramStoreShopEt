-- ============================================
-- Admin Refactor: Run this in Supabase SQL Editor
-- ============================================

-- 1. Create stores table
create table if not exists public.stores (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  owner_id bigint not null,
  name text not null,
  constraint stores_pkey primary key (id),
  constraint stores_owner_id_key unique (owner_id)
);

-- 2. Enable RLS on stores
alter table public.stores enable row level security;

-- 3. Allow everyone to read stores (needed for ownership check)
create policy "Stores are viewable by everyone"
  on public.stores for select
  using ( true );

-- 4. Insert the owner's store record
-- Owner Telegram ID: 5908397596
insert into public.stores (owner_id, name)
values (5908397596, 'My Store')
on conflict (owner_id) do nothing;
