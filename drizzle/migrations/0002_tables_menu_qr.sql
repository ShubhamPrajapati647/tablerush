-- Table statuses
create type public.table_status as enum ('available', 'occupied', 'order_pending', 'preparing', 'ready');

-- ============ TABLES ============
create table public.tables (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  table_number text not null,
  capacity integer not null default 2,
  status public.table_status not null default 'available',
  qr_token text not null unique default encode(gen_random_bytes(16), 'hex'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, table_number)
);

grant select, insert, update, delete on public.tables to authenticated;
grant all on public.tables to service_role;

alter table public.tables enable row level security;

create policy "Business members read own tables" on public.tables
  for select to authenticated
  using (public.has_business_access(business_id, auth.uid()) or public.is_admin(auth.uid()));

create policy "Business members insert own tables" on public.tables
  for insert to authenticated
  with check (public.has_business_access(business_id, auth.uid()) or public.is_admin(auth.uid()));

create policy "Business members update own tables" on public.tables
  for update to authenticated
  using (public.has_business_access(business_id, auth.uid()) or public.is_admin(auth.uid()))
  with check (public.has_business_access(business_id, auth.uid()) or public.is_admin(auth.uid()));

create policy "Business members delete own tables" on public.tables
  for delete to authenticated
  using (public.has_business_access(business_id, auth.uid()) or public.is_admin(auth.uid()));

create trigger tables_touch_updated_at before update on public.tables
  for each row execute function public.touch_updated_at();

-- qr_token must never change from the client
create or replace function public.guard_table_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.qr_token is distinct from old.qr_token then
    new.qr_token := old.qr_token;
  end if;
  if new.business_id is distinct from old.business_id then
    raise exception 'business_id cannot be changed';
  end if;
  return new;
end;
$$;

create trigger tables_guard_update before update on public.tables
  for each row execute function public.guard_table_update();

-- ============ MENU CATEGORIES ============
create table public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (business_id, name)
);

grant select, insert, update, delete on public.menu_categories to authenticated;
grant select on public.menu_categories to anon;
grant all on public.menu_categories to service_role;

alter table public.menu_categories enable row level security;

create policy "Public reads active venue categories" on public.menu_categories
  for select to anon, authenticated
  using (exists (select 1 from public.businesses b where b.id = business_id and b.status = 'active'));

create policy "Business members read own categories" on public.menu_categories
  for select to authenticated
  using (public.has_business_access(business_id, auth.uid()) or public.is_admin(auth.uid()));

create policy "Business members insert own categories" on public.menu_categories
  for insert to authenticated
  with check (public.has_business_access(business_id, auth.uid()) or public.is_admin(auth.uid()));

create policy "Business members update own categories" on public.menu_categories
  for update to authenticated
  using (public.has_business_access(business_id, auth.uid()) or public.is_admin(auth.uid()))
  with check (public.has_business_access(business_id, auth.uid()) or public.is_admin(auth.uid()));

create policy "Business members delete own categories" on public.menu_categories
  for delete to authenticated
  using (public.has_business_access(business_id, auth.uid()) or public.is_admin(auth.uid()));

-- ============ MENU ITEMS ============
create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  category_id uuid references public.menu_categories(id) on delete set null,
  name text not null,
  description text,
  price numeric(10,2) not null default 0,
  image_url text,
  is_vegetarian boolean not null default true,
  is_available boolean not null default true,
  prep_minutes integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.menu_items to authenticated;
grant select on public.menu_items to anon;
grant all on public.menu_items to service_role;

alter table public.menu_items enable row level security;

create policy "Public reads active venue items" on public.menu_items
  for select to anon, authenticated
  using (
    is_available
    and exists (select 1 from public.businesses b where b.id = business_id and b.status = 'active')
  );

create policy "Business members read own items" on public.menu_items
  for select to authenticated
  using (public.has_business_access(business_id, auth.uid()) or public.is_admin(auth.uid()));

create policy "Business members insert own items" on public.menu_items
  for insert to authenticated
  with check (public.has_business_access(business_id, auth.uid()) or public.is_admin(auth.uid()));

create policy "Business members update own items" on public.menu_items
  for update to authenticated
  using (public.has_business_access(business_id, auth.uid()) or public.is_admin(auth.uid()))
  with check (public.has_business_access(business_id, auth.uid()) or public.is_admin(auth.uid()));

create policy "Business members delete own items" on public.menu_items
  for delete to authenticated
  using (public.has_business_access(business_id, auth.uid()) or public.is_admin(auth.uid()));

create trigger menu_items_touch_updated_at before update on public.menu_items
  for each row execute function public.touch_updated_at();

-- ============ MENU ITEM ADDONS ============
create table public.menu_item_addons (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  price numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.menu_item_addons to authenticated;
grant select on public.menu_item_addons to anon;
grant all on public.menu_item_addons to service_role;

alter table public.menu_item_addons enable row level security;

create policy "Public reads active venue addons" on public.menu_item_addons
  for select to anon, authenticated
  using (exists (select 1 from public.businesses b where b.id = business_id and b.status = 'active'));

create policy "Business members read own addons" on public.menu_item_addons
  for select to authenticated
  using (public.has_business_access(business_id, auth.uid()) or public.is_admin(auth.uid()));

create policy "Business members insert own addons" on public.menu_item_addons
  for insert to authenticated
  with check (public.has_business_access(business_id, auth.uid()) or public.is_admin(auth.uid()));

create policy "Business members update own addons" on public.menu_item_addons
  for update to authenticated
  using (public.has_business_access(business_id, auth.uid()) or public.is_admin(auth.uid()))
  with check (public.has_business_access(business_id, auth.uid()) or public.is_admin(auth.uid()));

create policy "Business members delete own addons" on public.menu_item_addons
  for delete to authenticated
  using (public.has_business_access(business_id, auth.uid()) or public.is_admin(auth.uid()));

create index menu_items_business_idx on public.menu_items(business_id);
create index menu_items_category_idx on public.menu_items(category_id);
create index menu_addons_item_idx on public.menu_item_addons(menu_item_id);
create index tables_business_idx on public.tables(business_id);
