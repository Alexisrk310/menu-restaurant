-- Function to delete a user from auth.users (and cascade to public.profiles)
-- This must be run in the Supabase SQL Editor

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

  -- Delete from auth.users
  -- This will cascade to public.profiles if you have "on delete cascade" set up on your foreign key.
  -- If not, we should manually delete from profiles first or rely on the trigger.
  -- Standard Supabase setup has Foreign Key on profiles.id -> auth.users.id
  
  delete from auth.users where id = user_uuid;
end;
$$ language plpgsql;
