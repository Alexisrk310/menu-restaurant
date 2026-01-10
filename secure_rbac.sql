-- SECURE RBAC FOR PROFILES (Run in Supabase SQL Editor)

-- Enable RLS on profiles if not already enabled
alter table public.profiles enable row level security;

-- 1. VIEW POLICIES
-- Admins can view all profiles
create policy "Admins can view all profiles"
  on public.profiles for select
  using (
    auth.uid() in (
      select id from public.profiles where role = 'admin'
    )
  );

-- Users can view their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using ( auth.uid() = id );

-- 2. UPDATE POLICIES
-- Only Admins can update profiles (Role management)
create policy "Admins can update any profile"
  on public.profiles for update
  using (
    auth.uid() in (
      select id from public.profiles where role = 'admin'
    )
  );
  
-- Users can update their own profile basic info (optional, restrict role column in trigger or API)
-- For now, purely Admin managed as per request
-- If you want waiters to edit their own name:
-- create policy "Users can update own profile" ...

-- 3. INSERT/DELETE
-- Handled by Triggers (Insert) or Admin RPC (Delete) mostly.
-- But for direct deletes:
create policy "Admins can delete profiles"
  on public.profiles for delete
  using (
    auth.uid() in (
      select id from public.profiles where role = 'admin'
    )
  );

-- DISHES & CATEGORIES (Allow Waiters)
-- Ensure Dishes/Categories are editable by Waiters
-- (Assuming existing policies might be too loose or non-existent, let's reinforce)

-- Policy for Dishes
create policy "Staff (Admin/Waiter) can manage dishes"
  on public.dishes for all
  using (
    auth.uid() in (
      select id from public.profiles where role in ('admin', 'waiter')
    )
  );

-- Policy for Categories
create policy "Staff (Admin/Waiter) can manage categories"
  on public.categories for all
  using (
    auth.uid() in (
      select id from public.profiles where role in ('admin', 'waiter')
    )
  );
