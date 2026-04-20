"""
Run from the data/ directory after seeding:
  python embed_lyrics.py

Options:
  --database-url "postgresql://..."   Use a remote DB instead of local
  --force                             Re-embed songs already at 398 dims
"""

import json
import os
import sys
import time

import dotenv
dotenv.load_dotenv(dotenv.find_dotenv())

import psycopg

from db import get_db
from vector_utils import build_full_feature_vector, fetch_lyrics, l2_normalize

SLEEP_BETWEEN_REQUESTS = 0.3  # seconds — polite rate for LRCLIB/lyrics.ovh

# connects to either local DB (default) or remote DB if --database-url is provided
def get_connection():
    if len(sys.argv) > 1 and sys.argv[1] == '--database-url' and len(sys.argv) > 2:
        url = sys.argv[2]
        conn = psycopg.connect(url)
        sys.argv.pop(1)
        sys.argv.pop(1)
        return conn
    url = os.environ.get('DATABASE_URL')
    if url:
        return psycopg.connect(url)
    return get_db()

def main():
    force = '--force' in sys.argv
    conn = get_connection()

    # Fetch all songs with their primary artist name
    with conn.cursor() as cur:
        cur.execute("""
            SELECT DISTINCT ON (s.song_id)
                   s.song_id, s.song_name, s.genre, s.release_date,
                   s.duration_ms, s.feature_vector, a.artist_name
            FROM songs s
            LEFT JOIN song_artists sa ON s.song_id = sa.song_id
            LEFT JOIN artists a ON sa.artist_id = a.artist_id
            ORDER BY s.song_id
        """)
        songs = cur.fetchall()

    print(f"Found {len(songs)} songs in DB.")

    # Determine which songs need updating
    to_update = []
    skipped = 0
    for song_id, song_name, genre, release_date, duration_ms, feature_vector, artist_name in songs:
        existing = feature_vector if isinstance(feature_vector, list) else (json.loads(feature_vector) if feature_vector else [])
        if len(existing) == 398 and not force:
            skipped += 1
            continue
        to_update.append((song_id, song_name, genre, release_date, duration_ms, artist_name))

    if skipped:
        print(f"Skipping {skipped} songs already at 398 dims (use --force to re-embed).")
    print(f"Embedding {len(to_update)} songs...\n")

    found = 0
    instrumental = 0
    missed = 0

    for i, (song_id, song_name, genre, release_date, duration_ms, artist_name) in enumerate(to_update, 1):
        artist_display = artist_name or 'Unknown'
        print(f"[{i}/{len(to_update)}] {artist_display} — {song_name}", end=' ... ', flush=True)

        lyrics, is_instrumental = fetch_lyrics(artist_display, song_name)

        if is_instrumental:
            print("instrumental")
            instrumental += 1
        elif lyrics:
            print("found")
            found += 1
        else:
            print("not found (zero lyric vector)")
            missed += 1

        vec = l2_normalize(build_full_feature_vector(genre, release_date, duration_ms, lyrics))

        with conn.cursor() as cur:
            cur.execute(
                "UPDATE songs SET feature_vector = %s::jsonb WHERE song_id = %s",
                (json.dumps(vec), song_id)
            )
        conn.commit()

        if i < len(to_update):
            time.sleep(SLEEP_BETWEEN_REQUESTS)

    print(f"\nDone!")
    print(f"  Lyrics found:   {found}")
    print(f"  Instrumental:   {instrumental}")
    print(f"  Not found:      {missed}")
    print(f"  Total updated:  {found + instrumental + missed}")
    conn.close()


if __name__ == '__main__':
    main()
