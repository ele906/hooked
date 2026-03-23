import sys, os
from flask import Flask, jsonify, request

# adds parent directory to path so we can import from data/
# only have to do this bc app.py is in backend/ and not the root of the project
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from data.db import get_db
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


def sql_cmd(command, params=(), fetch=False):
    conn = get_db()
    cur = conn.cursor()
    
    cur.execute(command, params)
    conn.commit()
    
    result = cur.fetchall() if fetch else None
    cur.close()
    conn.close()
    return result

@app.route("/api/songs/action", methods=["POST"])
def store_interaction():
    data = request.get_json()

    sql_cmd(
        "INSERT INTO interactions (user_id, song_id, type) VALUES (%s, %s, %s);",
        (data["user_id"], data["song_id"], data["action"])
    )

    if data["action"] == "like":
        sql_cmd(
            "INSERT INTO liked (user_id, song_id) VALUES (%s, %s) ON CONFLICT DO NOTHING;",
            (data["user_id"], data["song_id"])
        )
    elif data["action"] == "dislike":
        sql_cmd(
            "INSERT INTO disliked (user_id, song_id) VALUES (%s, %s) ON CONFLICT DO NOTHING;",
            (data["user_id"], data["song_id"])
        )

    return jsonify({"status": "ok"}), 201

@app.route("/api/songs/liked", methods=["GET"])
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
        (user_id, ),
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


@app.route("/api/songs/next", methods=["GET"])
def next_song():
    user_id = request.args.get("user_id")
    rows = sql_cmd("""
            SELECT s.song_id, s.song_name, s.song_image_url, s.preview_mp3_url,
                a.artist_name
            FROM songs s
            JOIN song_artists sa ON s.song_id = sa.song_id
            JOIN artists a ON sa.artist_id = a.artist_id
            WHERE s.song_id NOT IN (
                SELECT song_id FROM liked WHERE user_id = %s
                UNION
                SELECT song_id FROM disliked WHERE user_id = %s
            )
            LIMIT 1;
        """, (user_id, user_id), fetch=True)

    if not rows:
        return jsonify({"message": "no more songs"}), 404

    r = rows[0]
    return jsonify({
        "song_id":          r[0],
        "song_name":        r[1],
        "song_image_url":   r[2],
        "preview_mp3_url":  r[3],
        "artist_name":      r[4]
    })

if __name__ == "__main__":
    app.run(debug=True)
