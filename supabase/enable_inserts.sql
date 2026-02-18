
-- Run this in your Supabase SQL Editor to allow public uploads for the Admin Interface
-- Only do this for development/MVP purposes. For production, implement proper authentication.

create policy "Enable insert for all users" 
on "public"."products" 
for insert 
to public 
with check (true);

-- Optional: If you want to allow updates/deletes from the admin interface later
-- create policy "Enable update for all users" on "public"."products" for update to public using (true);
-- create policy "Enable delete for all users" on "public"."products" for delete to public using (true);
