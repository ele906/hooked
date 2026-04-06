# -----------------------------------------------------------------------
# app.py
# backend for hooked
# authors: Eleanor, Sadat, Stephen, Derek
# -----------------------------------------------------------------------

import sys, os, json, random
import flask
from flask import Flask, jsonify, request, session, redirect, url_for, g
from authlib.integrations.flask_client import OAuth
from dotenv import load_dotenv
import bcrypt

load_dotenv()

# URLs from environment variables
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")

# adds parent directory to path so we can import from data/
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from data.db import get_db as _open_db
from data.vector_utils import cosine_similarity, update_weight_vector, l2_normalize, init_weight_vector_from_prefs
from flask_cors import CORS
from werkzeug.middleware.proxy_fix import ProxyFix

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY")
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

# Configure session cookies for cross-domain communication
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = True

# Configure CORS to allow requests from frontend URL
# In development, allows localhost:3000; in production, uses FRONTEND_URL env var
allowed_origins = os.environ.get("ALLOWED_ORIGINS", FRONTEND_URL).split(",")
CORS(app, 
     origins=allowed_origins,
     supports_credentials=True)

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
    print("GOOGLE_CLIENT_ID:", GOOGLE_CLIENT_ID, flush=True)
    print("REDIRECT_URI:", redirect_uri, flush=True)
    return google.authorize_redirect(redirect_uri)

# callback route that Google redirects to after login
@app.route("/auth/callback")
def auth_callback():
    token = google.authorize_access_token()
    user_info = token.get("userinfo")
    email = user_info["email"]
    name = user_info.get("name", "")
    
    # Insert user if not already in DB
    sql_cmd(
        """INSERT INTO users (email, username) 
        VALUES (%s, %s) 
        ON CONFLICT (email) DO NOTHING;""",
        (email, email)
    )
    
    # Get user_id from database
    rows = sql_cmd(
        "SELECT user_id FROM users WHERE email = %s",
        (email,),
        fetch=True
    )
    
    user_id = rows[0][0] if rows else None
    
    session["user"] = {
        "email": email,
        "name": name,
        "user_id": user_id,
    }
    return redirect(f"{FRONTEND_URL}/swipe")

# logs out by clearing the session, then redirects back to the frontend
@app.route("/auth/logout")
def logout():
    session.pop("user", None)
    return redirect(FRONTEND_URL)

# returns the logged-in user's info, or 401 if not logged in
@app.route("/auth/user")
def get_user():
    user = session.get("user")
    if user:
        return jsonify(user)
    return jsonify(None), 401
# signup route 
@app.route("/auth/signup", methods=["POST"])
def signup():
    data = request.get_json()
    email = data.get("email", "")
    username = data.get("username", "")
    password = data.get("password", "")
    if not email or not username or not password:
        return jsonify({"error": "All fields are required"}), 400
    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    try:
        rows = sql_cmd(
            """INSERT INTO users (email, username, password_hash)
            VALUES (%s, %s, %s)
            RETURNING user_id;""",
            (email, username, hashed),
            fetch=True
        )
        user_id = rows[0][0]
        session["user"] = {
            "email": email,
            "name": username,
            "user_id": user_id,
        }
        return jsonify({"user_id": user_id}), 201
    except Exception as e:
        if "users_email_key" in str(e):
            return jsonify({"error": "Email already taken"}), 409
        if "users_username_key" in str(e):
            return jsonify({"error": "Username already taken"}), 409
        return jsonify({"error": str(e)}), 500


EPSILON = 0.15  # fraction of requests served randomly for exploration

# returns the DB connection for the current request, opening one if needed
# Flask's teardown closes it automatically when the request ends
def get_db():
    if 'db' not in g:
        g.db = _open_db()
    return g.db

# closes the DB connection at the end of the request
@app.teardown_appcontext
def close_db(e=None):
    db = g.pop('db', None)
    if db is not None:
        db.close()

# helper to run SQL commands. reuses the single per-request connection
# before this would open multiple conenections per request which
# was not neccessary
def sql_cmd(command, params=(), fetch=False):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(command, params)
    conn.commit()
    result = cur.fetchall() if fetch else None
    cur.close()
    return result


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
    user = session.get("user")
    user_id = user["user_id"]
    
    sql_cmd("DELETE FROM liked WHERE user_id = %s AND song_id = %s;", (user_id, song_id))
    
    sql_cmd("DELETE FROM interactions WHERE user_id = %s AND song_id = %s;", (user_id, song_id))
    
    return jsonify({"status": "deleted"}), 200

# this is for the search bar function...
@app.route("/api/songs/search", methods=["GET"])
def search_songs():
    query = request.args.get("params", "")

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
        "SELECT user_id, email, password_hash FROM users WHERE username = %s",
        (username,),
        fetch=True
    )

    if not result:
        return flask.jsonify({'logged_in': False, 'error': 'User not found'}), 401

    user_id, email, stored_hash = result[0]

    import bcrypt
    if bcrypt.checkpw(password.encode(), stored_hash.encode()):
        session["user"] = {
            "email": email,
            "name": username,
            "user_id": user_id,
        }
        return flask.jsonify({'logged_in': True, 'user_id': user_id})

    return flask.jsonify({'logged_in': False, 'error': 'Wrong password'}), 401

if __name__ == "__main__":
    # Get port from environment (Render sets this), default to 5000 for local dev
    port = int(os.environ.get("PORT", 5000))
    # Disable debug mode in production
    debug_mode = os.environ.get("FLASK_ENV", "development") == "development"
    app.run(host="0.0.0.0", port=port, debug=debug_mode)