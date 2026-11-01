-- Migration 0049: in-app feedback (bugs, ideas, missing videos)
--
-- Replaces the "Report an issue" email link. A client starts a thread
-- (feedback) with a type and a first message, and both sides add
-- messages to it (feedback_messages), so it reads like a small chat.
--
-- Clients, through their own session (RLS):
--   - see and start only their own threads
--   - add only their own messages, never marked as the coach's
--   - cannot change a thread's status or unread flags
-- The coach reads and replies through the server with the service role
-- key, behind the coach check (lib/data/feedback.js), the same way the
-- rest of the coach screens work. Nothing here gives the coach account
-- extra database rights.
--
-- Safe to re-run.

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('bug', 'idea', 'video', 'other')),
  status text not null default 'new' check (status in ('new', 'open', 'done')),
  -- true when the coach has replied and the client hasn't opened it yet
  client_unread boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.feedback_messages (
  id uuid primary key default gen_random_uuid(),
  feedback_id uuid not null references public.feedback (id) on delete cascade,
  author_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  from_coach boolean not null default false,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists feedback_user_idx on public.feedback (user_id, updated_at desc);
create index if not exists feedback_status_idx on public.feedback (status, updated_at desc);
create index if not exists feedback_messages_thread_idx on public.feedback_messages (feedback_id, created_at);

alter table public.feedback enable row level security;
alter table public.feedback_messages enable row level security;

drop policy if exists "own feedback readable" on public.feedback;
create policy "own feedback readable" on public.feedback
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "own feedback insertable" on public.feedback;
create policy "own feedback insertable" on public.feedback
  for insert to authenticated
  with check (user_id = auth.uid() and status = 'new' and client_unread = false);

drop policy if exists "own feedback messages readable" on public.feedback_messages;
create policy "own feedback messages readable" on public.feedback_messages
  for select to authenticated
  using (exists (select 1 from public.feedback f where f.id = feedback_id and f.user_id = auth.uid()));

drop policy if exists "own feedback messages insertable" on public.feedback_messages;
create policy "own feedback messages insertable" on public.feedback_messages
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and from_coach = false
    and exists (select 1 from public.feedback f where f.id = feedback_id and f.user_id = auth.uid())
  );

-- No update or delete policies: clients can't edit or remove messages, or
-- change status. The coach does that on the server.
