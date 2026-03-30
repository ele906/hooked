# function to seed songs into the database using the iTunes Search API. called like "python seed_songs.py 'song name 1 artist name 1' 'song name 2 artist name 2' ..."
import json
import requests
import time
from db import get_db
from vector_utils import build_feature_vector, l2_normalize
import sys

# sample test songs of varying genres to test recommendations with
SONGS_TEST = [
    # The Weeknd
    ("The Weeknd", "Blinding Lights"),
    ("The Weeknd", "Starboy"),
    ("The Weeknd", "Save Your Tears"),
    ("The Weeknd", "Can't Feel My Face"),
    ("The Weeknd", "The Hills"),
    ("The Weeknd", "Earned It"),
    ("The Weeknd", "Often"),
    ("The Weeknd", "Heartless"),
    ("The Weeknd", "Die For You"),
    ("The Weeknd", "In Your Eyes"),
    # Don Toliver
    ("Don Toliver", "Private Landing"),
    ("Don Toliver", "Do It Right"),
    ("Don Toliver", "Leave The Club"),
    ("Don Toliver", "Lose My Mind"),
    ("Don Toliver", "Attitude"),
    ("Don Toliver", "Tore Up"),
    ("Don Toliver", "Euphoria"),
    ("Don Toliver", "Don't Go"),
    ("Don Toliver", "Bandit"),
    ("Don Toliver", "Had Enough"),
    # Kids That Fly
    ("Kids That Fly", "Dead Beat City"),
    ("Kids That Fly", "Kiss Her You Fool"),
    ("Kids That Fly", "Sunday in London"),
    ("Kids That Fly", "For the Night"),
    ("Kids That Fly", "Hazel"),
    # WHALES•TALK
    ("WHALES•TALK", "Ottawa Rockstar"),
    ("WHALES•TALK", "Catching On"),
    ("WHALES•TALK", "DID I RLY LET GO"),
    ("WHALES•TALK", "UGLY TEARS"),
    ("WHALES•TALK", "Hypocrite"),
]

# if no CLI is provided, use the above test songs
if len(sys.argv) > 1:
    # CLI format: "Artist|Song Title"
    songs_to_seed = [tuple(arg.split("|", 1)) for arg in sys.argv[1:]]
else:
    songs_to_seed = SONGS_TEST

# requests from iTunes API to retrieve songs and insert them into the database with their metadata and feature vectors
# there is a time delay of 5 seconds between each request to avoid hitting rate limits
conn = get_db()
with conn.cursor() as cur:
    for artist, song in songs_to_seed:
        # gets song metadata from iTunes Search API
        try:
            resp = requests.get("https://itunes.apple.com/search", params={
                "term": f"{artist} {song}",
                "media": "music",
                "entity": "song",
                "limit": 5
            }, timeout=10)
            results = resp.json().get("results", [])
        except requests.exceptions.RequestException as e:
            print(f"Skipping '{song}' by {artist} — request failed: {e}")
            continue
        time.sleep(5)
        track = next(
            (r for r in results
             if artist.lower() in r["artistName"].lower()
             and song.lower() in r["trackName"].lower()),
            None
        )

        # if no matching result is found, skip this song
        # also skip if the song doesn't have a preview URL since we won't be able to play it in the app
        if not track:
            print(f"Skipping '{song}' by {artist} — no matching result found")
            continue
        if not track.get("previewUrl"):
            print(f"Skipping {track['trackName']} — no preview URL")
            continue

        print(f"Adding {track['trackName']} by {track['artistName']} to the database.")

        genre = track.get("primaryGenreName")
        release_date = track.get("releaseDate")
        duration_ms = track.get("trackTimeMillis")
        itunes_track_id = str(track["trackId"])

        feature_vec = l2_normalize(build_feature_vector(genre, release_date, duration_ms))

        # insert the song into the database and link it to its artist, creating the artist if they don't already exist 
        # also store the feature vector as JSON for later use in recommendations
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
            """INSERT INTO songs (song_name, preview_mp3_url, song_image_url, duration_ms, genre, release_date, itunes_track_id, feature_vector)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
               ON CONFLICT (itunes_track_id) DO NOTHING
               RETURNING song_id""",
            (track["trackName"], track["previewUrl"], track["artworkUrl100"],
             duration_ms, genre, release_date, itunes_track_id, json.dumps(feature_vec))
        )
        row = cur.fetchone()
        if row is None:
            print(f"Already in DB, skipping.")
            continue
        song_id = row[0]
        cur.execute(
            "INSERT INTO song_artists (song_id, artist_id) VALUES (%s, %s)",
            (song_id, artist_id)
        )
        
    conn.commit()
    print("Done!")
