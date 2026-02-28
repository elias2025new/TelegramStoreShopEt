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

-- Policy: Allow all actions for now
-- Since the app uses manual Telegram ID checks instead of Supabase Auth,
-- we'll rely on client-side security for the time being.
create policy "Allow all actions for announcements"
  on public.announcements for all
  using ( true )
  with check ( true );

-- Note: In this specific app, the admin check is usually done client-side based on Telegram ID.
-- For the most flexible RLS without full Supabase Auth, you might use a simpler policy or keep it open if focused on client-side security.
