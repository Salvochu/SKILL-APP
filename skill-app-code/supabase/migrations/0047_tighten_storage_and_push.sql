-- Migration 0047: tighter photo storage and push subscriptions
--
-- The app checks every photo before saving it (a real image, not too
-- big) and every push subscription (a real browser push service). But
-- the database rules also let a signed-in person write to their own
-- photo folder and their own push subscriptions straight from the
-- browser with their session, skipping the app. This moves the same
-- limits into Supabase itself, so they hold either way:
--
--   avatars          JPG, PNG, WebP or HEIC only, up to 5 MB
--   progress-photos  JPG only, up to 8 MB
--   push endpoints   Google, Mozilla, Apple or Microsoft push services
--                    only (the reminders job sends a request to every
--                    saved endpoint, so any other address would let
--                    someone aim the server at a site of their choice)
--
-- And the avatars bucket stops listing its files to anyone who asks.
-- Every profile photo still loads from its own link (that is what a
-- public bucket is for), but nobody can browse the bucket to collect
-- every account's id and photo any more. People still see and replace
-- their own.
--
-- Safe to re-run.

update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
where id = 'avatars';

update storage.buckets
set file_size_limit = 8388608,
    allowed_mime_types = array['image/jpeg']
where id = 'progress-photos';

drop policy if exists "avatar images are publicly readable" on storage.objects;
drop policy if exists "users read their own avatar" on storage.objects;
create policy "users read their own avatar"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- New and edited rows only ("not valid" skips the check on rows saved
-- before this; the reminders job already drops any that don't qualify).
alter table public.push_subscriptions drop constraint if exists push_endpoint_is_push_service;
alter table public.push_subscriptions add constraint push_endpoint_is_push_service check (
  endpoint ~ '^https://(fcm\.googleapis\.com|android\.googleapis\.com|([a-z0-9-]+\.)*push\.services\.mozilla\.com|([a-z0-9-]+\.)*push\.apple\.com|([a-z0-9-]+\.)*notify\.windows\.com)/'
) not valid;
