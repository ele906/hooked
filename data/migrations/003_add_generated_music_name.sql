-- Migration: add a user-editable name column to generated_music, so people
-- can name their generated tracks instead of only seeing the raw prompt.
--
-- This is a manual, one-time migration for the already-deployed database —
-- schema.sql reflects the end state, this file is how you get an existing
-- DB there without losing data. NOT auto-applied by anything.
--
-- Run with:
--   psql <DATABASE_URL> -f data/migrations/003_add_generated_music_name.sql

BEGIN;

ALTER TABLE generated_music ADD COLUMN IF NOT EXISTS name TEXT;

COMMIT;
