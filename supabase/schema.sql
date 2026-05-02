-- =====================================================================
-- Nexa Serviços V2 — Supabase schema
-- =====================================================================
-- Como aplicar:
--   1. Crie um projeto em https://supabase.com (free tier basta)
--   2. Abra: Dashboard → SQL Editor → "New query"
--   3. Cole TODO este arquivo e clique "RUN"
--   4. Em seguida rode `seed.sql` para popular produtos iniciais
-- =====================================================================

-- Extensões necessárias
create extension if not exists "pgcrypto";

-- =====================================================================
-- PROFILES — perfis públicos vinculados ao auth.users do Supabase
-- =====================================================================
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text unique not null,
  email         text not null,
  display_name  text,
  bio           text,
  avatar        text default 'gradient-1',
  role          text not null default 'user' check (role in ('user','admin')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists profiles_username_lower_idx on public.profiles (lower(username));
create index if not exists profiles_role_idx on public.profiles (role);

-- =====================================================================
-- PRODUCTS — catálogo de bots Discord
-- =====================================================================
create table if not exists public.products (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  slug              text unique,
  category          text not null check (category in ('bots')),
  short_description text,
  description       text,
  price             numeric(10,2) not null check (price >= 0),
  image             text,
  icon              text default 'bot',
  badge             text,
  active            boolean not null default true,
  recommended       boolean not null default false,
  features          jsonb default '[]'::jsonb,
  metadata          jsonb default '{}'::jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists products_category_idx on public.products (category);
create index if not exists products_active_idx on public.products (active);

-- =====================================================================
-- PURCHASES — pedidos do usuário (status manual via tickets Discord)
-- =====================================================================
create table if not exists public.purchases (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  product_id        uuid references public.products(id) on delete set null,
  product_name      text not null,
  product_category  text,
  price             numeric(10,2) not null check (price >= 0),
  period            text default 'vitalício',
  status            text not null default 'pendente'
                      check (status in ('pendente','aprovado','entregue','cancelado')),
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists purchases_user_id_idx on public.purchases (user_id);
create index if not exists purchases_status_idx on public.purchases (status);
create index if not exists purchases_created_at_idx on public.purchases (created_at desc);

-- =====================================================================
-- ACTIVITY LOGS — auditoria leve de eventos do sistema
-- =====================================================================
create table if not exists public.activity_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete set null,
  type        text not null,
  message     text not null,
  data        jsonb default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists activity_logs_user_id_idx on public.activity_logs (user_id);
create index if not exists activity_logs_created_at_idx on public.activity_logs (created_at desc);

-- =====================================================================
-- NOTIFICATIONS — central de notificações in-app
-- =====================================================================
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  message     text not null,
  type        text default 'info' check (type in ('info','success','warning','error')),
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists notifications_user_id_idx on public.notifications (user_id);
create index if not exists notifications_read_idx on public.notifications (read);

-- =====================================================================
-- HELPERS / FUNCTIONS
-- =====================================================================

-- Verifica se o usuário logado é admin (usada nas RLS policies)
create or replace function public.is_admin()
returns boolean language sql stable security definer as $$
  select coalesce(
    (select role = 'admin' from public.profiles where id = auth.uid()),
    false
  );
$$;

-- Verifica se um username está livre (case-insensitive)
create or replace function public.username_available(p_username text)
returns boolean language sql stable security definer as $$
  select not exists (
    select 1 from public.profiles where lower(username) = lower(p_username)
  );
$$;

-- Trigger function: cria automaticamente um perfil ao registrar via auth
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
set search_path = public
as $$
declare
  uname text;
begin
  uname := coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1));
  insert into public.profiles (id, username, email, display_name, avatar, role)
  values (
    new.id,
    uname,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', uname),
    coalesce(new.raw_user_meta_data->>'avatar', 'gradient-1'),
    case when new.email = 'devbot2026@nexaservicos.app' then 'admin' else 'user' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Bind do trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Trigger genérico para updated_at
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists tg_profiles_updated on public.profiles;
create trigger tg_profiles_updated before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists tg_products_updated on public.products;
create trigger tg_products_updated before update on public.products
  for each row execute function public.touch_updated_at();

drop trigger if exists tg_purchases_updated on public.purchases;
create trigger tg_purchases_updated before update on public.purchases
  for each row execute function public.touch_updated_at();

-- =====================================================================
-- ROW-LEVEL SECURITY
-- =====================================================================

alter table public.profiles       enable row level security;
alter table public.products       enable row level security;
alter table public.purchases      enable row level security;
alter table public.activity_logs  enable row level security;
alter table public.notifications  enable row level security;

-- ---- PROFILES ----
drop policy if exists "profiles_read_all"      on public.profiles;
drop policy if exists "profiles_update_own"    on public.profiles;
drop policy if exists "profiles_admin_all"     on public.profiles;
drop policy if exists "profiles_insert_self"   on public.profiles;

create policy "profiles_read_all" on public.profiles
  for select using (true);

create policy "profiles_insert_self" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "profiles_admin_all" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- PRODUCTS ----
drop policy if exists "products_read_active"  on public.products;
drop policy if exists "products_admin_all"    on public.products;

create policy "products_read_active" on public.products
  for select using (active = true or public.is_admin());

create policy "products_admin_all" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- PURCHASES ----
drop policy if exists "purchases_read_own"     on public.purchases;
drop policy if exists "purchases_insert_own"   on public.purchases;
drop policy if exists "purchases_update_own"   on public.purchases;
drop policy if exists "purchases_admin_all"    on public.purchases;

create policy "purchases_read_own" on public.purchases
  for select using (auth.uid() = user_id);

create policy "purchases_insert_own" on public.purchases
  for insert with check (auth.uid() = user_id);

create policy "purchases_update_own" on public.purchases
  for update using (auth.uid() = user_id and status = 'pendente');

create policy "purchases_admin_all" on public.purchases
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- ACTIVITY LOGS ----
drop policy if exists "activity_read_own"   on public.activity_logs;
drop policy if exists "activity_insert_self" on public.activity_logs;
drop policy if exists "activity_admin_all"  on public.activity_logs;

create policy "activity_read_own" on public.activity_logs
  for select using (auth.uid() = user_id);

create policy "activity_insert_self" on public.activity_logs
  for insert with check (auth.uid() = user_id or user_id is null);

create policy "activity_admin_all" on public.activity_logs
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- NOTIFICATIONS ----
drop policy if exists "notifications_read_own"    on public.notifications;
drop policy if exists "notifications_update_own"  on public.notifications;
drop policy if exists "notifications_admin_all"   on public.notifications;

create policy "notifications_read_own" on public.notifications
  for select using (auth.uid() = user_id);

create policy "notifications_update_own" on public.notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "notifications_admin_all" on public.notifications
  for all using (public.is_admin()) with check (public.is_admin());

-- =====================================================================
-- REALTIME (opcional — habilita updates em tempo real para purchases)
-- =====================================================================
alter publication supabase_realtime add table public.purchases;
alter publication supabase_realtime add table public.notifications;
