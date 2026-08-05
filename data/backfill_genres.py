"""Backfill genre for songs seeded before the songs.genre column existed
(see migrations/001_remove_content_vectors.sql). Re-queries iTunes by
artist + song title and stores primaryGenreName.

Run once after applying the migration:
    python data/backfill_genres.py
"""
import time

import requests

from db import get_db

conn = get_db()
cur = conn.cursor()

cur.execute("""
    SELECT s.song_id, s.song_name, a.artist_name
    FROM songs s
    JOIN song_artists sa ON s.song_id = sa.song_id
    JOIN artists a ON sa.artist_id = a.artist_id
    WHERE s.genre IS NULL
""")
songs = cur.fetchall()
print(f"Found {len(songs)} songs without genre")

updated = 0
failed = 0
for i, (song_id, song_name, artist_name) in enumerate(songs):
    try:
        resp = requests.get("https://itunes.apple.com/search", params={
            "term": f"{artist_name} {song_name}",
            "media": "music",
            "entity": "song",
            "limit": 5,
        }, timeout=10)
        results = resp.json().get("results", [])

        match = next(
            (r for r in results
             if artist_name.lower() in r.get("artistName", "").lower()
             and song_name.lower() in r.get("trackName", "").lower()),
            None
        )
        genre = match.get("primaryGenreName") if match else None

        if genre:
            cur.execute("UPDATE songs SET genre = %s WHERE song_id = %s", (genre, song_id))
            updated += 1
            print(f"  [{i + 1}/{len(songs)}] {artist_name} — {song_name} -> {genre}")
        else:
            print(f"  [{i + 1}/{len(songs)}] {artist_name} — {song_name} -> no match, skipping")

        if updated % 50 == 0:
            conn.commit()

        time.sleep(3)  # iTunes API limit: ~20 calls/min
    except requests.exceptions.RequestException as e:
        failed += 1
        print(f"  FAILED: {artist_name} — {song_name}: {e}")

conn.commit()
print(f"\nDone! Updated: {updated}, Failed: {failed}")
conn.close()
