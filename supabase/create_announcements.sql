-- Create announcements table
create table if not exists announcements (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text not null,
  type text not null check (type in ('news', 'vlog', 'announcement')),
  media_url text,
  store_id uuid references public.stores(id) on delete cascade,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.announcements enable row level security;

-- Policy: Everyone can read announcements
create policy "Announcements are viewable by everyone"
  on public.announcements for select
  using ( true );

-- Policy: Only store owners/admins can insert/update/delete
create policy "Admins can manage announcements"
  on public.announcements for all
  using (
    exists (
      select 1 from public.stores
      where id = announcements.store_id
      and owner_id::text = auth.uid()::text
    )
    or
    exists (
      select 1 from public.store_admins
      where store_id = announcements.store_id
      and telegram_id::text = auth.uid()::text
    )
  );

-- Note: In this specific app, the admin check is usually done client-side based on Telegram ID.
-- For the most flexible RLS without full Supabase Auth, you might use a simpler policy or keep it open if focused on client-side security.
