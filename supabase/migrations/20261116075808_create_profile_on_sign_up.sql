-- Create a profile automatically the first time someone signs in (issue #6).
-- Supabase Auth adds a row to auth.users on first sign in. This trigger copies the
-- GitHub details Supabase receives (username, name, avatar) into public.profiles.
-- The role stays empty; the user picks candidate or employer during onboarding (#8).

create function private.handle_new_user()
returns trigger
language plpgsql
security definer -- needs to write to public.profiles on behalf of the new user
set search_path = ''
as $$
begin
  insert into public.profiles (id, github_username, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'user_name',
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();
