-- Storage for company logos (issue #13).
--
-- A public bucket: anyone can view a logo through its public URL, which is
-- what candidates need when they browse jobs. The bucket itself rejects files
-- over 2 MB and anything that is not a PNG, JPEG, or WebP image. SVG is left
-- out on purpose because an SVG file can contain scripts.
--
-- Each employer's files live in a folder named after their user id, for
-- example company-logos/<user id>/logo-1731790000000.png. The policies below
-- check that folder name, so employers can only change their own files.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('company-logos', 'company-logos', true, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

-- Owners can see their own files through the API (needed to replace or delete
-- them). Public URLs work for everyone without this policy.
create policy "Owners can view their company logo files"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'company-logos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Only employers can upload, and only into their own folder.
create policy "Employers can upload a logo to their own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'company-logos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select private.current_user_role()) = 'employer'
  );

create policy "Owners can replace their company logo files"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'company-logos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'company-logos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Owners can delete their company logo files"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'company-logos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
