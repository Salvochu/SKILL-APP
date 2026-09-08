-- User's explicit choice between the simple app and the full one (reps in
-- reserve in the logger, program weeks, the strength benchmark, trend
-- charts). NULL means "not chosen" - the app falls back to a sensible
-- default (simple for a new beginner, full for everyone else).
alter table profiles add column if not exists advanced_tracking boolean;
