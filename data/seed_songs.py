import requests
import time
from db import get_db
import sys


# if len(sys.argv) < 2:
#   print("Not enough arguments")
#   sys.exit(1)
#songs_to_add = sys.argv[1:]

SONGS_TEST = [
    "The Weeknd Blinding Lights",
    "The Weeknd Starboy",
    "The Weeknd Save Your Tears",
    "The Weeknd Can't Feel My Face",
    "The Weeknd The Hills",
    "The Weeknd Earned It",
    "The Weeknd Often",
    "The Weeknd Heartless",
    "The Weeknd Die For You",
    "The Weeknd In Your Eyes",
]

conn = get_db()
with conn.cursor() as cur:
    for query in SONGS_TEST:
        resp = requests.get("https://itunes.apple.com/search", params={
            "term": query,
            "media": "music",
            "limit": 1
        })
        track = resp.json()["results"][0]
        print(f"Adding {track['trackName']} by {track['artistName']} to the database."
            )
        cur.execute(
            "INSERT INTO artists (artist_name) VALUES (%s) ON CONFLICT (artist_name) DO NOTHING;",
            (track["artistName"],)
        )
        cur.execute(
            "SELECT artist_id FROM artists WHERE artist_name = %s",
            (track["artistName"],)
        )
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
    

        # this auto adds the test users so it doesnt break!
        # time.sleep() WE CAN ADD A DELAY IF NEEDED
        # file_path = "add_test_data.sql"
        # with open(file_path, 'r') as f:
        #    sql_script = f.read()
        #    cur.execute(sql_script)
        #    conn.commit()
        #    print(f"Executed {file_path}")

    conn.commit()
    print("Done!")