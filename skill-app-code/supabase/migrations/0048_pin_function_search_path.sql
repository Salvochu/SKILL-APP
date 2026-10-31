-- Migration 0048: pin the search path of the 0046 guard functions
--
-- Supabase's Security Advisor flags functions without a fixed
-- search_path ("Function Search Path Mutable"): a function that looks
-- names up through the caller's search path could, in principle, be
-- tricked into using a same-named object from another schema. These
-- three already name everything with its schema (public.…) or use
-- built-ins, so pinning the path to empty changes nothing about how
-- they behave; it just closes the door and clears the warnings.
--
-- Safe to re-run.

alter function public.is_user_request() set search_path = '';
alter function public.guard_profile_access() set search_path = '';
alter function public.guard_mesocycle_access() set search_path = '';
