BEGIN;

-- 0) Ensure pgvector extension is installed
CREATE EXTENSION IF NOT EXISTS vector;

-- 1) users.email_verified
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false;

UPDATE public.users
SET email_verified = false
WHERE email_verified IS NULL;

-- 2) nonces table
CREATE TABLE IF NOT EXISTS public.nonces (
    nonce text NOT NULL,
    username text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'nonces_pkey'
    ) THEN
        ALTER TABLE ONLY public.nonces
        ADD CONSTRAINT nonces_pkey PRIMARY KEY (nonce);
    END IF;
END $$;

-- 3) Ensure songs.feature_vector is vector(398) type (for pgvector operators)
DO $$
DECLARE
    col_type text;
BEGIN
    SELECT format_type(a.atttypid, a.atttypmod)
    INTO col_type
    FROM pg_attribute a
    JOIN pg_class c ON a.attrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND c.relname = 'songs'
      AND a.attname = 'feature_vector'
      AND a.attnum > 0
      AND NOT a.attisdropped;

    IF col_type IS NULL THEN
        -- Column doesn't exist, add it
        ALTER TABLE public.songs ADD COLUMN feature_vector vector(398);
    ELSIF col_type = 'jsonb' THEN
        -- Convert jsonb back to vector if needed
        ALTER TABLE public.songs DROP COLUMN feature_vector;
        ALTER TABLE public.songs ADD COLUMN feature_vector vector(398);
    END IF;
END $$;

-- 4) Ensure user_profiles.weight_vector is vector(398) type (for pgvector operators)
DO $$
DECLARE
    col_type text;
BEGIN
    SELECT format_type(a.atttypid, a.atttypmod)
    INTO col_type
    FROM pg_attribute a
    JOIN pg_class c ON a.attrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND c.relname = 'user_profiles'
      AND a.attname = 'weight_vector'
      AND a.attnum > 0
      AND NOT a.attisdropped;

    IF col_type IS NULL THEN
        -- Column doesn't exist, add it
        ALTER TABLE public.user_profiles ADD COLUMN weight_vector vector(398);
    ELSIF col_type = 'jsonb' THEN
        -- Convert jsonb back to vector if needed (set to null for now, will reinitialize on next swipe)
        ALTER TABLE public.user_profiles DROP COLUMN weight_vector;
        ALTER TABLE public.user_profiles ADD COLUMN weight_vector vector(398);
    END IF;
END $$;

-- 5) Set default for weight_vector (empty vector or null)
ALTER TABLE public.user_profiles ALTER COLUMN weight_vector SET DEFAULT NULL;

-- 6) Create index on feature_vector for faster similarity search
CREATE INDEX IF NOT EXISTS feature_vector_idx ON public.songs USING ivfflat (feature_vector vector_cosine_ops);

-- 8) Clean up bad 14-dimensional weight vectors from users who selected preferences before the fix
-- These will reinitialize as proper 398D vectors when users next interact with the app
DELETE FROM user_profiles WHERE weight_vector IS NOT NULL 
  AND (jsonb_array_length(weight_vector) = 14 OR jsonb_array_length(weight_vector) < 100);

-- 9) Add evaluation columns to interactions
ALTER TABLE public.interactions
    ADD COLUMN IF NOT EXISTS served_by TEXT CHECK (served_by IN ('similarity', 'exploration')),
    ADD COLUMN IF NOT EXISTS session_id TEXT;

-- 10) Add seed_genres to user_profiles
ALTER TABLE public.user_profiles
    ADD COLUMN IF NOT EXISTS seed_genres JSONB;

COMMIT;