-- Migration 0046: users cannot change their own access
--
-- Every table lets a signed-in user manage their own rows, which is
-- right for their name, goals, workouts and so on. But two of those rows
-- also hold access, and a user could rewrite them straight from the
-- browser with their own session, skipping the app entirely:
--
--   profiles.role         'coach' opens the coach screens: every
--                         client's name, email, phone and training data.
--   profiles.membership   'member' skips the paywall; deleting the whole
--                         profile row did the same (no row reads as a
--                         grandfathered member).
--   user_mesocycles       moving the challenge's started_at, or deleting
--                         or re-adding the challenge run, restarted the
--                         free 14 days.
--
-- After this, only trusted server code (the service role: the GHL and
-- Stripe webhooks, the coach's invite) and the SQL editor can change any
-- of that. Everything the app itself does with a user's session still
-- works: saving the profile, onboarding, the Start my 14 days button,
-- switching equipment, starting, finishing and stopping programs.
-- Deleting an account still works too (it goes through the service role
-- and cascades).
--
-- Safe to re-run.

-- Whether the current request was made with a user's own session (or
-- none). The service role and the SQL editor return false.
create or replace function public.is_user_request()
returns boolean
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')::json ->> 'role',
    ''
  ) in ('authenticated', 'anon');
$$;

-- profiles: role and membership are read-only for users.
create or replace function public.guard_profile_access()
returns trigger
language plpgsql
as $$
begin
  if not public.is_user_request() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    -- A row a user creates for themselves starts with no access of its
    -- own (the webhooks set membership when they create accounts).
    new.role := 'client';
    new.membership := null;
  elsif new.role is distinct from old.role or new.membership is distinct from old.membership then
    raise exception 'Only the coach can change role or membership'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_profile_access on public.profiles;
create trigger guard_profile_access
  before insert or update on public.profiles
  for each row execute function public.guard_profile_access();

-- Users keep reading, creating and editing their own profile, but can no
-- longer delete it.
drop policy if exists "users manage their own profile" on public.profiles;
drop policy if exists "users read their own profile" on public.profiles;
drop policy if exists "users create their own profile" on public.profiles;
drop policy if exists "users update their own profile" on public.profiles;
create policy "users read their own profile" on public.profiles
  for select to authenticated using (auth.uid() = user_id);
create policy "users create their own profile" on public.profiles
  for insert to authenticated with check (auth.uid() = user_id);
create policy "users update their own profile" on public.profiles
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- user_mesocycles: the challenge clock only moves forward, once.
create or replace function public.guard_mesocycle_access()
returns trigger
language plpgsql
as $$
begin
  if not public.is_user_request() then
    return coalesce(new, old);
  end if;

  if tg_op = 'DELETE' then
    raise exception 'Programs cannot be deleted' using errcode = '42501';
  end if;

  if tg_op = 'INSERT' then
    -- A new run always starts unstarted; the challenge only once per
    -- account (the sign-up webhook normally creates it; onboarding adds
    -- it only when that was missed).
    new.started_at := null;
    if new.template_id = 'main-character-14' and exists (
      select 1 from public.user_mesocycles
      where user_id = new.user_id and template_id = 'main-character-14'
    ) then
      raise exception 'The 14-Day Challenge can only be started once'
        using errcode = '42501';
    end if;
    return new;
  end if;

  -- UPDATE
  if new.user_id is distinct from old.user_id or new.template_id is distinct from old.template_id then
    raise exception 'A program cannot be moved to another plan or account'
      using errcode = '42501';
  end if;
  if old.started_at is not null then
    -- Already running: the start can't move, and neither can the date
    -- the days are counted from.
    if new.started_at is distinct from old.started_at or new.start_date is distinct from old.start_date then
      raise exception 'The start date cannot be changed' using errcode = '42501';
    end if;
  elsif new.started_at is not null then
    -- The Start my 14 days button: today (a day either side for time
    -- zones), and start_date follows it.
    if new.started_at not between current_date - 1 and current_date + 1
       or new.start_date is distinct from new.started_at then
      raise exception 'The start date cannot be changed' using errcode = '42501';
    end if;
  elsif new.start_date is distinct from old.start_date then
    raise exception 'The start date cannot be changed' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_mesocycle_access on public.user_mesocycles;
create trigger guard_mesocycle_access
  before insert or update or delete on public.user_mesocycles
  for each row execute function public.guard_mesocycle_access();
