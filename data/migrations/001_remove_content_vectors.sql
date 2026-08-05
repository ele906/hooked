-- Migration: remove the old content-based (pgvector) recommendation system,
-- replaced by neural collaborative filtering (data/cf_model.py) with a
-- genre-preference cold-start fallback (data/genres.py).
--
-- This is a manual, one-time migration for the already-deployed database —
-- schema.sql reflects the end state, this file is how you get an existing
-- DB there without losing data. NOT auto-applied by anything. Back up first.
--
-- Run with:
--   psql <DATABASE_URL> -f data/migrations/001_remove_content_vectors.sql

BEGIN;

-- 1. Add the new genre column songs need for the cold-start path.
--    Existing rows will have NULL genre until data/backfill_genres.py runs.
ALTER TABLE songs ADD COLUMN IF NOT EXISTS genre TEXT;
CREATE INDEX IF NOT EXISTS songs_genre_idx ON songs (genre);

-- 2. Drop the old content-based columns. The old partial index on
--    "songs (song_id) WHERE feature_vector IS NOT NULL" is dropped
--    automatically by Postgres since it depends on this column.
ALTER TABLE songs DROP COLUMN IF EXISTS feature_vector;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS weight_vector;
ALTER TABLE users DROP COLUMN IF EXISTS weight_vector;

-- 3. Update the served_by values the recommendation endpoint now writes.
ALTER TABLE interactions DROP CONSTRAINT IF EXISTS interactions_served_by_check;
ALTER TABLE interactions ADD CONSTRAINT interactions_served_by_check
    CHECK (served_by IN ('cf', 'genre_preference', 'exploration'));

-- 4. The vector extension is no longer used anywhere in the schema.
--    Only drop it if nothing else in this database depends on it.
DROP EXTENSION IF EXISTS vector;

COMMIT;

-- After running this:
--   python data/backfill_genres.py
-- to populate genre for songs seeded before this migration.
