--- stores user data ---
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_image_url TEXT
);

--- stores artist data ---
CREATE TABLE artists (
    artist_id SERIAL PRIMARY KEY,
    artist_name TEXT NOT NULL UNIQUE
);

--- stores album data ---
CREATE TABLE albums (
    album_id SERIAL PRIMARY KEY,
    album_name TEXT NOT NULL,
    release_date DATE,
    cover_image_url TEXT
);

--- stores song data ---
CREATE TABLE songs (
    song_id SERIAL PRIMARY KEY,
    song_name TEXT NOT NULL,
    album_id INTEGER REFERENCES albums(album_id) ON DELETE CASCADE,
    preview_mp3_url TEXT UNIQUE,
    song_image_url TEXT,
    genre TEXT
);

--- joins songs to artists ---
CREATE TABLE song_artists (
    PRIMARY KEY (song_id, artist_id),
    song_id INTEGER REFERENCES songs(song_id) ON DELETE CASCADE,
    artist_id INTEGER REFERENCES artists(artist_id) ON DELETE CASCADE
);

--- interaction table ---
CREATE TABLE interactions (
    interaction_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    song_id INTEGER REFERENCES songs(song_id) ON DELETE CASCADE,
    type VARCHAR(20) CHECK (type IN ('play', 'like', 'dislike', 'favorite')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    served_by TEXT CHECK (served_by IN ('cf', 'genre_preference', 'exploration')),
    session_id TEXT
);

--- stores user taste profiles ---
CREATE TABLE user_profiles (
    user_id INTEGER PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    seed_genres JSONB,
    seed_decades JSONB,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--- friend connections ---
CREATE TABLE friends (
    PRIMARY KEY (user_id, friend_id),
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    friend_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--- liked songs for quick access ---
CREATE TABLE liked (
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    song_id INTEGER REFERENCES songs(song_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, song_id)
);

--- disliked songs for quick access ---
CREATE TABLE disliked (
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    song_id INTEGER REFERENCES songs(song_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, song_id)
);

--- temporary nonces for OAuth flows ---
CREATE TABLE nonces (
    nonce TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--- stores user-generated music clips ---
CREATE TABLE generated_music (
    clip_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    audio_url TEXT NOT NULL,
    prompt TEXT,
    name TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--- indexes for hot query paths ---
CREATE INDEX ON interactions (user_id, song_id);
CREATE INDEX ON songs (genre);
CREATE INDEX ON generated_music (user_id);