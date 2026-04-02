# -----------------------------------------------------------------------
# app.py
# backend for hooked
# authors: Eleanor, Sadat, Stephen, Derek, Lucille
# -----------------------------------------------------------------------

import sys, os, json, random
import flask
from flask import Flask, jsonify, request, session, redirect, url_for
from authlib.integrations.flask_client import OAuth

# adds parent directory to path so we can import from data/
# only have to do this bc app.py is in backend/ and not the root of the project
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from data.db import get_db
from data.vector_utils import cosine_similarity, update_weight_vector, l2_normalize, init_weight_vector_from_prefs
from flask_cors import CORS

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY")
CORS(app, supports_credentials=True)

# helper function to run SQL commands with proper connection handling
def sql_cmd(command, params=(), fetch=False):
    conn = get_db()
    cur = conn.cursor()
    
    cur.execute(command, params)
    conn.commit()
    
    result = cur.fetchall() if fetch else None
    cur.close()
    conn.close()
    return result


# Google OAuth setup
oauth = OAuth(app)
GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID')
GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET')    
CONF_URL = 'https://accounts.google.com/.well-known/openid-configuration'
google = oauth.register(
        name='google',
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET,
        server_metadata_url=CONF_URL,
        client_kwargs={
            'scope': 'openid email profile'
        }
    )

# Authentication routes
@app.route("/auth/login")
def login():
    redirect_uri = url_for("auth_callback", _external=True)
    return google.authorize_redirect(redirect_uri)

# callback route that Google redirects to after login
@app.route("/auth/callback")
def auth_callback():
    token = google.authorize_access_token()
    user_info = token.get("userinfo")
    session["user"] = {
        "email": user_info["email"],
        "name": user_info.get("name", ""),
    }
    sql_cmd(
        """INSERT INTO users (email, username) 
        VALUES (%s, %s) 
        ON CONFLICT (email) DO NOTHING;""",
        (user_info["email"], user_info["email"])
    )
    return redirect("http://localhost:3000/swipe")

# logs out by clearing the session, then redirects back to the frontend
@app.route("/auth/logout")
def logout():
    session.pop("user", None)
    return redirect("http://localhost:3000")

# returns the logged-in user's info, or 401 if not logged in
@app.route("/auth/user")
def get_user():
    user = session.get("user")
    if user:
        return jsonify(user)
    return jsonify(None), 401


EPSILON = 0.15  # fraction of requests served randomly for exploration

# API route to handle user interactions (like/dislike) and update their profile vector accordingly
@app.route("/api/songs/action", methods=["POST"])
def store_interaction():
    data = request.get_json()

    # Update interactions table
    sql_cmd(
        "INSERT INTO interactions (user_id, song_id, type) VALUES (%s, %s, %s);",
        (data["user_id"], data["song_id"], data["action"])
    )

    # Update liked/disliked tables
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

    # Update user weight vector based on this swipe
    song_rows = sql_cmd(
        "SELECT feature_vector FROM songs WHERE song_id = %s",
        (data["song_id"],), fetch=True
    )

    # if the song has a feature vector, update the user's weight vector accordingly
    if song_rows and song_rows[0][0] is not None:
        song_vec = song_rows[0][0]

        profile_rows = sql_cmd(
            "SELECT weight_vector FROM user_profiles WHERE user_id = %s",
            (data["user_id"],), fetch=True
        )

        if profile_rows and profile_rows[0][0] is not None:
            new_vec = update_weight_vector(profile_rows[0][0], song_vec, data["action"])
        else:
            # No profile yet — initialize from this song's vector
            new_vec = l2_normalize(song_vec[:])

        sql_cmd(
            """INSERT INTO user_profiles (user_id, weight_vector, updated_at)
               VALUES (%s, %s, NOW())
               ON CONFLICT (user_id) DO UPDATE
               SET weight_vector = EXCLUDED.weight_vector, updated_at = NOW()""",
            (data["user_id"], json.dumps(new_vec))
        )

    return jsonify({"status": "ok"}), 201

# API route to get a list of songs the user has liked, along with artist info and when they liked it
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
            "liked_at":         r[5].isoformat() if r[5] else None
        } for r in rows])

# API route to get the next song recommendation for a user, using cosine similarity ranking with epsilon-greedy exploration
@app.route("/api/songs/next", methods=["GET"])
def next_song():
    user_id = request.args.get("user_id")
    rows = sql_cmd("""
            SELECT s.song_id, s.song_name, s.song_image_url, s.preview_mp3_url,
                a.artist_name, s.feature_vector
            FROM songs s
            JOIN song_artists sa ON s.song_id = sa.song_id
            JOIN artists a ON sa.artist_id = a.artist_id
            WHERE s.song_id NOT IN (
                SELECT song_id FROM liked WHERE user_id = %s
                UNION
                SELECT song_id FROM disliked WHERE user_id = %s
            )
            AND s.feature_vector IS NOT NULL;
        """, (user_id, user_id), fetch=True)

    if not rows:
        return jsonify({"message": "no more songs"}), 404

    # Use cosine similarity ranking unless exploring randomly
    profile_rows = sql_cmd(
        "SELECT weight_vector FROM user_profiles WHERE user_id = %s",
        (user_id,), fetch=True
    )
 
    if profile_rows and profile_rows[0][0] is not None and random.random() > EPSILON:
        weight_vec = profile_rows[0][0]
        best = max(rows, key=lambda r: cosine_similarity(weight_vec, r[5]))
    else:
        best = random.choice(rows)

    return jsonify({
        "song_id":          best[0],
        "song_name":        best[1],
        "song_image_url":   best[2],
        "preview_mp3_url":  best[3],
        "artist_name":      best[4]
    })

# For deleting a liked song from liked songs
@app.route("/api/songs/liked/<int:song_id>", methods=["DELETE"])
def delete_liked_song(song_id):
    user_id = 1
    
    sql_cmd("DELETE FROM liked WHERE user_id = %s AND song_id = %s;", (user_id, song_id))
    
    sql_cmd("DELETE FROM interactions WHERE user_id = %s AND song_id = %s;", (user_id, song_id))
    
    return jsonify({"status": "deleted"}), 200

# this is for the search bar function...
@app.route("/api/songs/search", methods=["GET"])
def search_songs():
    query = request.args.get("params", "")
    print("searching for:", query)

    if not query:
        return jsonify({"error": "params parameter is required"}), 400

    rows = sql_cmd("""
        SELECT s.song_id, s.song_name, s.song_image_url, s.preview_mp3_url,
               a.artist_name
        FROM songs s
        LEFT JOIN song_artists sa ON s.song_id = sa.song_id
        LEFT JOIN artists a ON sa.artist_id = a.artist_id
        WHERE s.song_name ILIKE %s OR a.artist_name ILIKE %s
        LIMIT 8;
    """, (f"%{query}%", f"%{query}%",), fetch=True)

    if not rows:
        return jsonify({"message": "no songs found"}), 200

    results = []
    for r in rows:
        results.append({
            "song_id":        r[0],
            "song_name":      r[1],
            "song_image_url": r[2],
            "preview_mp3_url": r[3],
            "artist_name":    r[4]
        })

    return jsonify(results)

# seed preference
@app.route('/api/seedpref', methods=['POST'])
def save_preferences():
    data = flask.request.get_json()
    genres = data.get('prefs', [])
    vec = init_weight_vector_from_prefs(genres)
    
    # save to DB
    user_id = flask.session['user_id']

    sql_cmd(
        "UPDATE users SET weight_vector = %s WHERE user_id = %s",
        (vec, user_id)
    )

    return flask.jsonify({'added weight vec to DB': True})

# check if password is right... 
@app.route('/api/checkpw', methods=['POST'])
def check_password():
    data = flask.request.get_json()
    username = data.get('username', "")
    password = data.get('password', "")

    result = sql_cmd(
        "SELECT * FROM users WHERE username = %s AND password_hash = %s",
        (username, password),
        fetch=True
    )

    if result:
        return flask.jsonify({'logged_in': True})
    return flask.jsonify({'logged_in': False})

if __name__ == "__main__":
    app.run(debug=True)
