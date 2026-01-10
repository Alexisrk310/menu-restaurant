-- FIX INFINITE RECURSION IN RLS (Run in Supabase SQL Editor)

-- 1. Create secure functions to check roles (Bypasses RLS loop)
create or replace function public.is_admin()
returns boolean
language sql
security definer -- Critical: Runs as owner, bypassing RLS
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
    and role = 'admin'
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
security definer
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
    and role in ('admin', 'waiter')
  );
$$;

-- 2. Drop the recursive policies (Clean slate for these specific ones)
drop policy if exists "Admins can view all profiles" on public.profiles;
drop policy if exists "Admins can update any profile" on public.profiles;
drop policy if exists "Admins can delete profiles" on public.profiles;
drop policy if exists "Staff (Admin/Waiter) can manage dishes" on public.dishes;
drop policy if exists "Staff (Admin/Waiter) can manage categories" on public.categories;

-- 3. Re-create policies using the secure functions

-- PROFILES
create policy "Admins can view all profiles"
  on public.profiles for select
  using ( is_admin() );

create policy "Admins can update any profile"
  on public.profiles for update
  using ( is_admin() );

create policy "Admins can delete profiles"
  on public.profiles for delete
  using ( is_admin() );

-- Note: "Users can view own profile" (auth.uid() = id) is safe and doesn't need changing.

-- DISHES
create policy "Staff can manage dishes"
  on public.dishes for all
  using ( is_staff() );

-- CATEGORIES
create policy "Staff can manage categories"
  on public.categories for all
  using ( is_staff() );
