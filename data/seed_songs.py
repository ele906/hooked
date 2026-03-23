# function to seed songs into the database using the iTunes Search API. called like "python seed_songs.py 'song name 1 artist name 1' 'song name 2 artist name 2' ..."
import requests
import time
from db import get_db
import sys

if len(sys.argv) < 2:
    print("Not enough arguments")
    sys.exit(1)
songs_to_add = sys.argv[1:]

conn = get_db()
with conn.cursor() as cur:
    for query in songs_to_add:
        resp = requests.get("https://itunes.apple.com/search", params={
            "term": query,
            "media": "music",
            "limit": 1
        })
        track = resp.json()["results"][0]
        print(f"Adding {track['trackName']} by {track['artistName']} to the database."
            )
        cur.execute("INSERT INTO artists (artist_name) VALUES (%s) RETURNING artist_id",
                    (track["artistName"],))
        artist_id = cur.fetchone()[0]
        cur.execute(
            "INSERT INTO songs (song_name, preview_mp3_url, song_image_url, duration_ms) VALUES (%s, %s, %s, %s) RETURNING song_id",
            (track["trackName"], track["previewUrl"], track["artworkUrl100"], track["trackTimeMillis"])
        )
        song_id = cur.fetchone()[0]
        cur.execute(
            "INSERT INTO song_artists (song_id, artist_id) VALUES (%s, %s)",
            (song_id, artist_id)
        )
        
        # time.sleep() WE CAN ADD A DELAY IF NEEDED

    conn.commit()
    print("Done!")