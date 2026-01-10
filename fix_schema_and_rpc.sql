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
