-- Migration 0019: progress photos
--
-- Private, per-user before/after photos. One or more per body check-in
-- date, tagged by angle (front / side / back). Unlike the avatars
-- bucket, this one is PRIVATE: an object is readable only by its owner,
-- and the app serves it through a short-lived signed URL. Nothing here
-- is ever public.
--
-- Safe to re-run.

create table if not exists progress_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  taken_on date not null default current_date,
  angle text not null default 'front' check (angle in ('front', 'side', 'back')),
  storage_path text not null unique,
  width int,
  height int,
  created_at timestamptz not null default now()
);
create index if not exists progress_photos_user_idx on progress_photos(user_id, taken_on desc);

alter table progress_photos enable row level security;
drop policy if exists "users manage their own progress photos" on progress_photos;
create policy "users manage their own progress photos"
  on progress_photos for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Private storage bucket + owner-only object policies.
insert into storage.buckets (id, name, public)
values ('progress-photos', 'progress-photos', false)
on conflict (id) do nothing;

drop policy if exists "users read their own progress photos" on storage.objects;
create policy "users read their own progress photos"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'progress-photos' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "users upload their own progress photos" on storage.objects;
create policy "users upload their own progress photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'progress-photos' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "users delete their own progress photos" on storage.objects;
create policy "users delete their own progress photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'progress-photos' and auth.uid()::text = (storage.foldername(name))[1]);
