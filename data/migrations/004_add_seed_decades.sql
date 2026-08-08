-- Migration: add seed_decades to user_profiles, mirroring seed_genres, so
-- onboarding can capture which decades a user likes alongside genres.
--
-- This is a manual, one-time migration for the already-deployed database —
-- schema.sql reflects the end state, this file is how you get an existing
-- DB there without losing data. NOT auto-applied by anything.
--
-- Run with:
--   psql <DATABASE_URL> -f data/migrations/004_add_seed_decades.sql

BEGIN;

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS seed_decades JSONB;

COMMIT;
