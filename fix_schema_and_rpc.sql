-- 1. Fix Schema: Add missing columns to profiles table
do $$ 
begin
    -- Add first_name if it doesn't exist
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'first_name') then
        alter table public.profiles add column first_name text;
    end if;

    -- Add last_name if it doesn't exist
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'last_name') then
        alter table public.profiles add column last_name text;
    end if;

    -- Add role if it doesn't exist (assuming it might be missing too, or just to be safe)
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'role') then
        alter table public.profiles add column role text default 'waiter';
    end if;

    -- Add updated_at if it doesn't exist (Fix for PGRST204)
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'updated_at') then
        alter table public.profiles add column updated_at timestamptz default now();
    end if;
end $$;

-- 1.1 Fix Check Constraint (profiles_role_check)
-- The error means the database expects specific values that don't match 'admin'/'waiter'
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('admin', 'waiter', 'user'));

-- 3. Fix Row Level Security (RLS) to allow admins to insert/update profiles
alter table public.profiles enable row level security;

-- Policy: Admins can do everything on profiles
-- Helper function to check admin status without triggering RLS recursion
create or replace function public.is_admin()
returns boolean
security definer
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role = 'admin'
  );
$$ language sql;

-- Policy: Admins can do everything on profiles
drop policy if exists "Admins can manage all profiles" on public.profiles;
create policy "Admins can manage all profiles"
on public.profiles
for all
using ( public.is_admin() );

-- Policy: Users can read their own profile (usually exists, but ensuring it)
drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles
for select
using ( auth.uid() = id );

-- Policy: Users can update their own profile
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
using ( auth.uid() = id );

-- 4. Restore Admin Role for the main account (Safety measure)
-- Since we added the column with default 'waiter', your old admin account might have been downgraded.
update public.profiles
set role = 'admin'
where id in (select id from auth.users where email = 'admin@gmail.com');

-- 2. Update the Deletion Function to handle dependencies
-- We explicitly delete the profile first to avoid Foreign Key violations if CASCADE is not configured.
create or replace function delete_user_by_id(user_uuid uuid)
returns void
security definer
as $$
begin
  -- Check if the requesting user is an admin
  if not exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role = 'admin'
  ) then
    raise exception 'Unauthorized';
  end if;

  -- Explicitly delete from public.profiles first
  -- This resolves the 409 Conflict if the FK is not set to CASCADE
  delete from public.profiles where id = user_uuid;

  -- Now delete from auth.users
  delete from auth.users where id = user_uuid;
end;
$$ language plpgsql;

-- 5. Helper function to get users with email verification status
-- Standard list() only returns profiles, which doesn't have email_confirmed_at.
create or replace function get_users_with_status()
returns table (
  id uuid,
  email varchar,
  first_name text,
  last_name text,
  role text,
  email_confirmed_at timestamptz
) 
security definer
as $$
begin
  if not public.is_admin() then
    raise exception 'Unauthorized';
  end if;

  return query
  select 
    au.id, 
    au.email::varchar, 
    p.first_name, 
    p.last_name, 
    p.role,
    au.email_confirmed_at
  from auth.users au
  join public.profiles p on p.id = au.id;
end;
$$ language plpgsql;

-- 6. Strict Protections for Dishes and Categories
-- Explicitly revoke write access for non-admins if table policies are loose, or add policies.
-- Assuming dishes/categories have RLS enabled. If not, we enable it.

alter table public.dishes enable row level security;
alter table public.categories enable row level security;

-- Dishes: Anyone can read (customers/waiters/admins)
drop policy if exists "Public dishes read access" on public.dishes;
create policy "Public dishes read access" on public.dishes for select using (true);

-- Dishes: Admins AND Waiters can manage (Insert/Update/Delete)
-- We use a check for either role.
drop policy if exists "Staff manage dishes" on public.dishes;
create policy "Staff manage dishes" on public.dishes for all using (
  exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role in ('admin', 'waiter')
  )
);

-- Categories: Anyone can read
drop policy if exists "Public categories read access" on public.categories;
create policy "Public categories read access" on public.categories for select using (true);

-- Categories: Admins AND Waiters can manage
drop policy if exists "Staff manage categories" on public.categories;
create policy "Staff manage categories" on public.categories for all using (
  exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role in ('admin', 'waiter')
  )
);
