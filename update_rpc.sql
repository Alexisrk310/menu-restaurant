-- RUN THIS IN SUPABASE SQL EDITOR

-- Function to get users with their email confirmation status
-- It joins public.profiles with auth.users securely
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
  -- Check if the requesting user is an admin
  -- We use an alias 'admin_check' to avoid ambiguity with the output 'id'
  if not exists (
    select 1 from public.profiles as admin_check
    where admin_check.id = auth.uid()
    and admin_check.role = 'admin'
  ) then
    raise exception 'Unauthorized';
  end if;

  return query
  select 
    p.id,
    au.email::varchar,
    p.first_name,
    p.last_name,
    p.role,
    au.email_confirmed_at
  from public.profiles p
  join auth.users au on p.id = au.id
  order by au.created_at desc; -- Fixed: Using auth.users.created_at instead of profiles.created_at
end;
$$ language plpgsql;
