-- Migration 0015: kg / lb display preference
--
-- All weights stay stored in kg. This is only how they are shown and
-- entered. Defaults to kg (the app's origin market).
--
-- Run in the Supabase SQL Editor after 0014. Safe to re-run.

alter table profiles add column if not exists unit_preference text not null default 'kg';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_unit_preference_check') then
    alter table profiles
      add constraint profiles_unit_preference_check check (unit_preference in ('kg', 'lb'));
  end if;
end $$;
