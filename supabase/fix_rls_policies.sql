
-- 1. Enable UPDATE for products
create policy "Enable update for all users" 
on "public"."products" 
for update 
to public 
using (true)
with check (true);

-- 2. Enable DELETE for products
create policy "Enable delete for all users" 
on "public"."products" 
for delete 
to public 
using (true);
