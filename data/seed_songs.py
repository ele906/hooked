# Defaults to auto-discover top songs for each artist in ARTISTS_BY_GENRE
#   1 API call per artist
#   60 artists × 5s sleep = ~5 minutes total
#
# CLI mode: seed specific songs manually.
#   python seed_songs.py "Artist|Song Title" "Artist2|Song Title2" ...

import json
import requests
import time
from db import get_db
from vector_utils import build_feature_vector, l2_normalize
import sys

# How many songs to pull per artist (filters for preview URL availability)
SONGS_PER_ARTIST = 8

# Artists grouped by genre — iTunes returns their top songs sorted by popularity
# Covers all 12 genre slots in the feature vector
# ~60 artists × 8 songs = ~480 songs (before filtering for missing preview URLs)
ARTISTS_BY_GENRE = {
    "pop": [
        "Taylor Swift", "Ed Sheeran", "Ariana Grande", "Dua Lipa",
        "Olivia Rodrigo", "Harry Styles", "Billie Eilish", "Post Malone",
        "Bruno Mars", "Katy Perry", "Lady Gaga", "Shawn Mendes",
    ],
    "hip-hop": [
        "Drake", "Kendrick Lamar", "J. Cole", "Travis Scott",
        "Future", "Lil Baby", "Tyler, the Creator", "Mac Miller",
        "Childish Gambino", "A$AP Rocky", "Nicki Minaj", "Cardi B",
    ],
    "r&b": [
        "The Weeknd", "SZA", "Don Toliver", "Khalid",
        "Daniel Caesar", "Bryson Tiller", "H.E.R.", "Summer Walker",
        "Ella Mai", "Frank Ocean", "Usher", "Miguel",
    ],
    "rock": [
        "Foo Fighters", "Red Hot Chili Peppers", "Arctic Monkeys",
        "The Strokes", "Nirvana", "Coldplay", "Imagine Dragons",
        "Twenty One Pilots", "The Killers", "Muse",
    ],
    "electronic": [
        "Calvin Harris", "Daft Punk", "The Chainsmokers",
        "Marshmello", "Avicii", "Zedd", "Kygo", "Disclosure",
    ],
    "country": [
        "Morgan Wallen", "Luke Combs", "Chris Stapleton",
        "Kacey Musgraves", "Zac Brown Band", "Thomas Rhett",
        "Tyler Childers", "Eric Church",
    ],
    "alternative": [
        "Tame Impala", "Vampire Weekend", "Bon Iver",
        "Lorde", "Hozier", "Alt-J", "Arcade Fire", "The National",
    ],
    "latin": [
        "Bad Bunny", "J Balvin", "Maluma", "Daddy Yankee",
        "Shakira", "Ozuna", "Rauw Alejandro", "Becky G",
    ],
    "metal": [
        "Metallica", "Linkin Park", "System of a Down",
        "Slipknot", "Avenged Sevenfold", "Disturbed",
    ],
    "indie": [
        "Mac DeMarco", "Phoebe Bridgers", "Clairo", "Mitski",
        "Waxahatchee", "Soccer Mommy", "Snail Mail",
        "Kids That Fly", "WHALES•TALK",
    ],
    "jazz": [
        "Norah Jones", "Amy Winehouse", "John Legend",
        "Alicia Keys", "Leon Bridges",
    ],
}

# returns the top n songs for an artist that have preview URLs
def fetch_top_songs_for_artist(artist, n=SONGS_PER_ARTIST):
    try:
        resp = requests.get("https://itunes.apple.com/search", params={
            "term": artist,
            "media": "music",
            "entity": "song",
            "attribute": "artistTerm",
            "limit": 50,  # fetch more so we can filter down to n with preview URLs
        }, timeout=10)
        results = resp.json().get("results", [])
    except requests.exceptions.RequestException as e:
        print(f"Request failed for {artist}: {e}")
        return []

    # filter to songs that actually match the artist and have a preview URL
    # aka songs we can play
    matches = [
        r for r in results
        if artist.lower() in r.get("artistName", "").lower()
        and r.get("previewUrl")
    ]
    return matches[:n]

# Insert a song dict from iTunes API into the DB + its artist and feature vector
def insert_track(cur, track):
    genre = track.get("primaryGenreName")
    release_date = track.get("releaseDate")
    duration_ms = track.get("trackTimeMillis")
    itunes_track_id = str(track["trackId"])

    feature_vec = l2_normalize(build_feature_vector(genre, release_date, duration_ms))

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
        """INSERT INTO songs (song_name, preview_mp3_url, song_image_url, duration_ms, genre,
                              release_date, itunes_track_id, feature_vector)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
           ON CONFLICT (itunes_track_id) DO NOTHING
           RETURNING song_id""",
        (track["trackName"], track["previewUrl"], track["artworkUrl100"].replace("100x100bb", "600x600bb"),
         duration_ms, genre, release_date, itunes_track_id, json.dumps(feature_vec))
    )
    row = cur.fetchone()
    if row is None:
        return False  # already in DB
    song_id = row[0]

    cur.execute(
        "INSERT INTO song_artists (song_id, artist_id) VALUES (%s, %s) ON CONFLICT DO NOTHING;",
        (song_id, artist_id)
    )
    return True


conn = get_db()

# CLI mode: seed specific songs manually
if len(sys.argv) > 1:
    songs_to_seed = [tuple(arg.split("|", 1)) for arg in sys.argv[1:]]
    with conn.cursor() as cur:
        for artist, song in songs_to_seed:
            try:
                resp = requests.get("https://itunes.apple.com/search", params={
                    "term": f"{artist} {song}",
                    "media": "music",
                    "entity": "song",
                    "limit": 5
                }, timeout=10)
                results = resp.json().get("results", [])
            except requests.exceptions.RequestException as e:
                print(f"Request failed for '{song}' by {artist}: {e}")
                continue
            time.sleep(5)

            track = next(
                (r for r in results
                 if artist.lower() in r["artistName"].lower()
                 and song.lower() in r["trackName"].lower()),
                None
            )
            if not track:
                print(f"Skipping '{song}' by {artist}: no matching result found")
                continue
            if not track.get("previewUrl"):
                print(f"Skipping {track['trackName']}: no preview URL")
                continue

            if not insert_track(cur, track):
                print("Already in DB, skipping.")

        conn.commit()
    print("Done!")

# fetch top songs per artist in each genre
else:
    total_added = 0
    with conn.cursor() as cur:
        for genre, artists in ARTISTS_BY_GENRE.items():
            for artist in artists:
                print(f"  Fetching: {artist}")
                tracks = fetch_top_songs_for_artist(artist)
                time.sleep(5)  # respect iTunes rate limit (~20 req/min)

                added = 0
                for track in tracks:
                    if insert_track(cur, track):
                        print(f"    + {track['trackName']}")
                        added += 1

                if not tracks:
                    print(f"    Skipping {artist}: No results with preview URLs")
        
                total_added += added

        conn.commit()
    print(f"\nDone! {total_added} new songs added.")
