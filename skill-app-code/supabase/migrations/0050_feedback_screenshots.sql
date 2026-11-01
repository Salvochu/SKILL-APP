-- Migration 0050: screenshots on feedback messages
--
-- A client can attach one screenshot to a feedback message. The app
-- shrinks it to a JPEG on the phone first, and the server checks it is a
-- real image before saving it.
--
-- Storage: a PRIVATE bucket, feedback-shots, JPG only, up to 5 MB. Each
-- client uploads into, and reads from, their own folder only. Nobody can
-- delete through the API; files go when the account is deleted
-- (app/(app)/profile/actions.js). The coach sees them through short-lived
-- signed URLs made on the server with the service role.
--
-- feedback_messages.image_path: a client's message may only point at a
-- file in their own folder, so nobody can get the coach's screen to show
-- someone else's screenshot.
--
-- Safe to re-run.

alter table public.feedback_messages add column if not exists image_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('feedback-shots', 'feedback-shots', false, 5242880, array['image/jpeg'])
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "users read their own feedback shots" on storage.objects;
create policy "users read their own feedback shots"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'feedback-shots' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "users upload their own feedback shots" on storage.objects;
create policy "users upload their own feedback shots"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'feedback-shots' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "own feedback messages insertable" on public.feedback_messages;
create policy "own feedback messages insertable" on public.feedback_messages
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and from_coach = false
    and (image_path is null or (storage.foldername(image_path))[1] = auth.uid()::text)
    and exists (select 1 from public.feedback f where f.id = feedback_id and f.user_id = auth.uid())
  );
