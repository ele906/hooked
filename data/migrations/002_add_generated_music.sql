-- Migration: add the generated_music table so AI-generated tracks persist
-- across restarts instead of only living in the in-memory job store.
--
-- This is a manual, one-time migration for the already-deployed database —
-- schema.sql reflects the end state, this file is how you get an existing
-- DB there without losing data. NOT auto-applied by anything.
--
-- Run with:
--   psql <DATABASE_URL> -f data/migrations/002_add_generated_music.sql

BEGIN;

CREATE TABLE IF NOT EXISTS generated_music (
    clip_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    audio_url TEXT NOT NULL,
    prompt TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS generated_music_user_id_idx ON generated_music (user_id);

COMMIT;
