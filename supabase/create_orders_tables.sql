-- Create orders table
create table public.orders (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  telegram_user_id text not null,
  full_name text not null,
  phone_number text not null,
  shipping_address text not null,
  location_data jsonb null,
  total_price numeric not null,
  status text not null default 'pending',
  payment_method text not null default 'cash_on_delivery',
  delivered_at timestamp with time zone null,
  constraint orders_pkey primary key (id)
);

-- Create order items table
create table public.order_items (
  id uuid not null default gen_random_uuid (),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity integer not null,
  unit_price numeric not null,
  selected_size text null,
  constraint order_items_pkey primary key (id)
);

-- Enable RLS
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Create policies (for now, allow public insertion for the mini app)
create policy "Allow public to insert orders"
  on public.orders for insert
  with check ( true );

create policy "Allow public to insert order items"
  on public.order_items for insert
  with check ( true );

-- Admins can view everything
create policy "Admins can view all orders"
  on public.orders for select
  using ( true );

create policy "Admins can view all order items"
  on public.order_items for select
  using ( true );

-- Allow admins to update orders (status changes, delivered_at, etc.)
create policy "Allow public to update orders"
  on public.orders for update
  using ( true )
  with check ( true );

-- Allow admins to delete orders
create policy "Allow public to delete orders"
  on public.orders for delete
  using ( true );

-- Allow admins to delete order items
create policy "Allow public to delete order items"
  on public.order_items for delete
  using ( true );
