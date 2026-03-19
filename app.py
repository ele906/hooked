from flask import Flask, jsonify, request
from data.db import get_db

app = Flask(__name__)


def sql_cmd(command, params=(), fetch=False):
    conn = get_db()
    cur = conn.cursor()
    
    cur.execute(command, params)
    conn.commit()
    
    result = cur.fetchall() if fetch else None
    cur.close()
    conn.close()
    return result

@app.route("/", methods=["POST"])
def store_interaction():
    data = request.get_json()

    sql_cmd(
        "INSERT INTO interactions (user_id, song_id, type) VALUES (%s, %s, %s);",
        (data["user_id"], data["song_id"], data["action"]),
        fetch = True
    )
    return jsonify({"status": "ok"}), 201

@app.route("/", methods=["GET"])
def get_liked_songs():
    user_id = request.args.get("user_id")

    rows = sql_cmd("""
        SELECT s.song_id, s.song_name, s.song_image_url, s.preview_mp3_url,
               a.artist_name, l.created_at
        FROM liked l
        JOIN songs s ON l.song_id = s.song_id
        JOIN song_artists sa ON s.song_id = sa.song_id
        JOIN artists a ON sa.artist_id = a.artist_id
        WHERE l.user_id = %s
        ORDER BY l.created_at DESC;
        """, 
        (user_id),
        fetch = True
    )

    return jsonify([{
            "song_id":          r[0],
            "song_name":        r[1],
            "song_image_url":   r[2],
            "preview_mp3_url":  r[3],
            "artist_name":      r[4],
            "liked_at":         r[5]
        } for r in rows])

@app.route("/", methods=["GET"])
def get_song():
    song_id = request.args.get("song_id")

    rows = sql_cmd("""
        SELECT s.song_id, s.song_name, s.song_image_url, s.preview_mp3_url,
            a.artist_name
        FROM songs s
        JOIN song_artists sa ON s.song_id = sa.song_id
        JOIN artists a ON sa.artist_id = a.artist_id
        WHERE s.song_id = %s;
    """, (song_id,), fetch=True)

    return jsonify([{
            "song_id":          r[0],
            "song_name":        r[1],
            "song_image_url":   r[2],
            "preview_mp3_url":  r[3],
            "artist_name":      r[4]
        } for r in rows])