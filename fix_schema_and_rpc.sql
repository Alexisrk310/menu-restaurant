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
end $$;

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
