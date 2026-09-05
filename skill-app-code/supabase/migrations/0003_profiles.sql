-- Migration 0003: user profiles + avatar storage
--
-- Adds a profiles table (one row per user, owner-only via RLS) for the
-- fields the new Profile screen collects: name, age, country, fitness
-- goal, experience level, phone. Also creates the avatars storage bucket
-- and its access policies.
--
-- Run in the Supabase SQL Editor after 0002. Safe to re-run.

create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  age smallint,
  country text,
  fitness_goal text,
  experience_level text,
  phone text,
  avatar_url text,
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_age_range'
  ) then
    alter table profiles
      add constraint profiles_age_range
      check (age is null or (age >= 13 and age <= 100));
  end if;
end $$;

alter table profiles enable row level security;

drop policy if exists "users manage their own profile" on profiles;
create policy "users manage their own profile"
  on profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Avatar storage. Public read (it is just a profile photo), writes
-- restricted to a folder named after the uploader's own user id.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatar images are publicly readable" on storage.objects;
create policy "avatar images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "users upload their own avatar" on storage.objects;
create policy "users upload their own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "users replace their own avatar" on storage.objects;
create policy "users replace their own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "users delete their own avatar" on storage.objects;
create policy "users delete their own avatar"
  on storage.objects for delete
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
