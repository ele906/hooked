# -----------------------------------------------------------------------
# app.py
# backend for hooked
# authors: Eleanor, Sadat, Stephen, Derek
# -----------------------------------------------------------------------

import sys, os, json, random
import flask
from flask import Flask, jsonify, request, session, redirect, url_for, g
from dotenv import load_dotenv
import bcrypt
import requests
import oauthlib.oauth2
import cloudinary_config 
import cloudinary.uploader

# Allow insecure transport for local development
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

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
# For production (HTTPS/remote): SameSite=None with Secure flag (required for cross-site cookies)
# For development (localhost): SameSite=Lax (more permissive, doesn't require Secure)
is_production = os.environ.get("FLASK_ENV") == "production" or "localhost" not in os.environ.get("FRONTEND_URL", "")
if is_production:
    app.config['SESSION_COOKIE_SAMESITE'] = 'None'
    app.config['SESSION_COOKIE_SECURE'] = True
    app.config['SESSION_COOKIE_HTTPONLY'] = True
else:
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
    app.config['SESSION_COOKIE_HTTPONLY'] = True

# Configure CORS to allow requests from frontend URL
# In development, allows localhost:3000; in production, uses FRONTEND_URL env var
allowed_origins = os.environ.get("ALLOWED_ORIGINS", FRONTEND_URL).split(",")
CORS(app, 
     origins=allowed_origins,
     supports_credentials=True)

# Google OAuth setup
GOOGLE_DISCOVERY_URL = 'https://accounts.google.com/.well-known/openid-configuration'
GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID')
GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET')

# Authentication routes
@app.route("/auth/login")
def login():
    # Clear any existing session (allow re-login with Google)
    session.clear()
    
    # Get Google's OAuth2 provider config
    google_provider_cfg = requests.get(GOOGLE_DISCOVERY_URL, timeout=10).json()
    auth_endpoint = google_provider_cfg['authorization_endpoint']
    
    # Create OAuth2 client
    client = oauthlib.oauth2.WebApplicationClient(GOOGLE_CLIENT_ID)
    
    # Build redirect URI and target page (passed as state)
    redirectToSwipe = f"{FRONTEND_URL}/swipe"
    redirect_uri = url_for("auth_callback", _external=True)
    
    # Prepare request URI (redirectToSwipe will be passed back as state)
    request_uri = client.prepare_request_uri(
        auth_endpoint,
        redirect_uri=redirect_uri,
        scope=['openid', 'email', 'profile'],
        state=redirectToSwipe
    )
    return redirect(request_uri)

# callback route that Google redirects to after login
@app.route("/auth/callback")
def auth_callback():
    # Get authorization code from Google redirect
    authorization_code = request.args.get('code')
    
    # Get the original URL from state parameter
    redirectToSwipe = request.args.get('state')
    
    # Get Google's OAuth2 token endpoint
    google_provider_cfg = requests.get(GOOGLE_DISCOVERY_URL, timeout=10).json()
    token_endpoint = google_provider_cfg['token_endpoint']
    userinfo_endpoint = google_provider_cfg['userinfo_endpoint']
    
    # Create OAuth2 client and prepare token request
    client = oauthlib.oauth2.WebApplicationClient(GOOGLE_CLIENT_ID)
    redirect_uri = url_for("auth_callback", _external=True)
    
    token_url, headers, body = client.prepare_token_request(
        token_endpoint,
        authorization_response=request.url,
        redirect_url=redirect_uri,
        code=authorization_code
    )
    
    # Exchange code for token
    token_response = requests.post(
        token_url,
        headers=headers,
        data=body,
        auth=(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET),
        timeout=10
    )
    
    if token_response.status_code != 200:
        return jsonify({"error": "Failed to get token"}), 400
    
    # Parse token response
    client.parse_request_body_response(json.dumps(token_response.json()))
    
    # Get user info
    uri, headers, body = client.add_token(userinfo_endpoint)
    userinfo_response = requests.get(uri, headers=headers, data=body, timeout=10)
    
    if userinfo_response.status_code != 200:
        return jsonify({"error": "Failed to get user info"}), 400
    
    # Verify email
    if not userinfo_response.json().get('email_verified'):
        return jsonify({"error": "Email not verified"}), 400
    
    # Extract user info
    user_info = userinfo_response.json()
    email = user_info.get('email', '')
    name = user_info.get('name', '')
    pfp = user_info.get('picture', '')
    username = email.split('@')[0]

    # Insert user if not already in DB
    sql_cmd(
        """INSERT INTO users (email, username, user_image_url) 
        VALUES (%s, %s, %s) 
        ON CONFLICT (email) DO UPDATE 
        SET user_image_url = EXCLUDED.user_image_url;""",
        (email, username, pfp)
    )
    
    # Get user_id from database
    rows = sql_cmd(
        "SELECT user_id FROM users WHERE email = %s",
        (email,),
        fetch=True
    )
    
    user_id = rows[0][0] if rows else None
    
    # Check if user is new (no preferences initialized yet)
    user_profile_rows = sql_cmd(
        "SELECT 1 FROM user_profiles WHERE user_id = %s",
        (user_id,),
        fetch=True
    )
    is_new_user = len(user_profile_rows) == 0
    
    # Determine redirect page
    redirect_page = f"{FRONTEND_URL}/seedprefs" if is_new_user else request.args.get('state', f"{FRONTEND_URL}/swipe")
    

    session["user"] = {
        "email": email,
        "name": username,  # "abc@gmail.com" → "abc",      # ← was just `name` from Google (full name)
        "user_id": user_id,
        "user_image_url": pfp,
    }
    return redirect(redirect_page)

# gets user's liked songs
@app.route("/api/users/<username>/liked", methods=["GET"])
def get_user_liked_songs(username):
    user = session.get("user")
    if not user:
        return jsonify({"error": "not logged in"}), 401

    rows = sql_cmd("""
        SELECT s.song_id, s.song_name, s.song_image_url, s.preview_mp3_url,
               a.artist_name, l.created_at
        FROM liked l
        JOIN songs s ON l.song_id = s.song_id
        JOIN song_artists sa ON s.song_id = sa.song_id
        JOIN artists a ON sa.artist_id = a.artist_id
        JOIN users u ON l.user_id = u.user_id
        WHERE u.username = %s
        ORDER BY l.created_at DESC;
    """, (username,), fetch=True)

    return jsonify([{
        "song_id":         r[0],
        "song_name":       r[1],
        "song_image_url":  r[2],
        "preview_mp3_url": r[3],
        "artist_name":     r[4],
        "liked_at":        r[5].isoformat() if r[5] else None
    } for r in rows])

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
        return jsonify({
            "user_id":  user["user_id"],
            "username": user.get("name"),
            "email":    user["email"],
            "picture":  user.get("user_image_url")
        })
    return jsonify(None), 401

# signup route 
@app.route("/auth/signup", methods=["POST"])
def signup():
    data = request.get_json()
    email = data.get("email", "")
    username = data.get("username", "")
    password = data.get("password", "")
    pfp = data.get("user_image_url", "")

    if not email or not username or not password or not pfp:
        return jsonify({"error": "All fields are required"}), 400
    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    try:
        rows = sql_cmd(
            """INSERT INTO users (email, username, password_hash, user_image_url)
            VALUES (%s, %s, %s, %s)
            RETURNING user_id;""",
            (email, username, hashed, pfp),
            fetch=True
        )
        user_id = rows[0][0]
        session["user"] = {
            "email": email,
            "name": username,
            "user_id": user_id,
            "user_image_url": pfp,
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
    user = session.get("user")
    if not user:
        return jsonify({"error": "not logged in"}), 401
    
    user_id = user["user_id"]  # from session, not frontend
    data = request.get_json()

    # Update interactions table
    sql_cmd(
        "INSERT INTO interactions (user_id, song_id, type) VALUES (%s, %s, %s);",
        (user_id, data["song_id"], data["action"])
    )

    # Update liked/disliked tables
    if data["action"] == "like":
        sql_cmd(
            "INSERT INTO liked (user_id, song_id) VALUES (%s, %s) ON CONFLICT DO NOTHING;",
            (user_id, data["song_id"])
        )
    elif data["action"] == "dislike":
        sql_cmd(
            "INSERT INTO disliked (user_id, song_id) VALUES (%s, %s) ON CONFLICT DO NOTHING;",
            (user_id, data["song_id"])
        )

    song_rows = sql_cmd(
        "SELECT feature_vector FROM songs WHERE song_id = %s",
        (data["song_id"],), fetch=True
    )

    if song_rows and song_rows[0][0] is not None:
        song_vec = song_rows[0][0]

        profile_rows = sql_cmd(
            "SELECT weight_vector FROM user_profiles WHERE user_id = %s",
            (user_id,), fetch=True
        )

        if profile_rows and profile_rows[0][0] is not None:
            new_vec = update_weight_vector(profile_rows[0][0], song_vec, data["action"])
        else:
            new_vec = l2_normalize(song_vec[:])

        sql_cmd(
            """INSERT INTO user_profiles (user_id, weight_vector, updated_at)
               VALUES (%s, %s, NOW())
               ON CONFLICT (user_id) DO UPDATE
               SET weight_vector = EXCLUDED.weight_vector, updated_at = NOW()""",
            (user_id, json.dumps(new_vec))
        )

    return jsonify({"status": "ok"}), 201

# API route to get a list of songs the user has liked, along with artist info and when they liked it
@app.route("/api/songs/liked", methods=["GET"])
def get_liked_songs():
    user = session.get("user")
    if not user:
        return jsonify({"error": "not logged in"}), 401
    user_id = user["user_id"]  # from session, not request.args

    rows = sql_cmd("""
        SELECT s.song_id, s.song_name, s.song_image_url, s.preview_mp3_url,
               a.artist_name, l.created_at
        FROM liked l
        JOIN songs s ON l.song_id = s.song_id
        JOIN song_artists sa ON s.song_id = sa.song_id
        JOIN artists a ON sa.artist_id = a.artist_id
        WHERE l.user_id = %s
        ORDER BY l.created_at DESC;
        """, (user_id,), fetch=True)

    return jsonify([{
            "song_id":        r[0],
            "song_name":      r[1],
            "song_image_url": r[2],
            "preview_mp3_url": r[3],
            "artist_name":    r[4],
            "liked_at":       r[5].isoformat() if r[5] else None
        } for r in rows])

# API route to get the next song recommendation for a user, using cosine similarity ranking with epsilon-greedy exploration
@app.route("/api/songs/next", methods=["GET"])
def next_song():
    user = session.get("user")
    if not user:
        return jsonify({"error": "not logged in"}), 401
    user_id = user["user_id"]  

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
        "song_id":        best[0],
        "song_name":      best[1],
        "song_image_url": best[2],
        "preview_mp3_url": best[3],
        "artist_name":    best[4]
    })

# For deleting a liked song from liked songs
@app.route("/api/songs/liked/<int:song_id>", methods=["DELETE"])
def delete_liked_song(song_id):
    user = session.get("user")

    if not user:
        return jsonify({"error": "not logged in"}), 401
    user_id = user["user_id"]
    
    sql_cmd("DELETE FROM liked WHERE user_id = %s AND song_id = %s;", (user_id, song_id))
    
    sql_cmd("DELETE FROM interactions WHERE user_id = %s AND song_id = %s;", (user_id, song_id))
    
    return jsonify({"status": "deleted"}), 200

# For deleting a song action (like/dislike) from interactions
@app.route("/api/songs/action/<int:song_id>", methods=["DELETE"])
def delete_song_action(song_id):
    user = session.get("user")
    if not user:
        return jsonify({"error": "not logged in"}), 401
    user_id = user["user_id"]

    try:
        sql_cmd("DELETE FROM interactions WHERE user_id = %s AND song_id = %s;", (user_id, song_id))
        sql_cmd("DELETE FROM liked WHERE user_id = %s AND song_id = %s;", (user_id, song_id))
        sql_cmd("DELETE FROM disliked WHERE user_id = %s AND song_id = %s;", (user_id, song_id))
        return jsonify({"status": "deleted"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# this is for the search bar function...
@app.route("/api/songs/search", methods=["GET"])
def search_songs():
    user = session.get("user")
    if not user:
        return jsonify({"error": "not logged in"}), 401

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

# this is for the search bar for freiendsfunction...
@app.route("/api/friends/search", methods=["GET"])
def search_friends():
    user = session.get("user")
    if not user:
        return jsonify({"error": "not logged in"}), 401

    query = request.args.get("query", "")

    if not query:
        return jsonify({"error": "query parameter is required"}), 400

    rows = sql_cmd("""
        SELECT u.username, u.user_image_url
        FROM users u
        WHERE u.username ILIKE %s OR u.email ILIKE %s
        LIMIT 8;
    """, (f"%{query}%", f"%{query}%",), fetch=True)

    if not rows:
        return jsonify({"users": []}), 200

    results = []
    for r in rows:
        results.append({
            "username":       r[0],
            "user_image_url": r[1],
        })

    return jsonify({"users": results}), 200

@app.route("/api/users/get/<username>", methods=["GET"])
def get_user_profile(username):
    user = session.get("user")
    if not user:
        return jsonify({"error": "not logged in"}), 401

    try:
        rows = sql_cmd("""
            SELECT username, user_image_url
            FROM users
            WHERE username = %s
        """, (username,), fetch=True)

        if not rows:
            return jsonify({"error": "user not found"}), 404

        r = rows[0]
        return jsonify({
            "username":       r[0],
            "user_image_url": r[1],
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/friends/add', methods=['POST']) 
def add_friend():
    user = flask.session.get('user')
    if not user:
        return flask.jsonify({'error': 'Not authenticated'}), 401
    
    data = flask.request.get_json()
    friend_username = data.get('friend_username')

    if not friend_username:
        return flask.jsonify({'error': 'friend_username required'}), 400

    # look up the friend's user_id from their username
    rows = sql_cmd(
        "SELECT user_id FROM users WHERE username = %s",
        (friend_username,), fetch=True
    )
    if not rows:
        return flask.jsonify({'error': 'user not found'}), 404

    my_id = user['user_id']
    friend_id = rows[0][0]

    if my_id == friend_id:
        return flask.jsonify({'error': 'cannot add yourself'}), 400

    # insert both directions
    sql_cmd(
        """INSERT INTO friends (user_id, friend_id)
           VALUES (%s, %s)
           ON CONFLICT (user_id, friend_id) DO NOTHING""",
        (my_id, friend_id)
    )
    sql_cmd(
        """INSERT INTO friends (user_id, friend_id)
           VALUES (%s, %s)
           ON CONFLICT (user_id, friend_id) DO NOTHING""",
        (friend_id, my_id)
    )

    return flask.jsonify({'added': True}), 200

# seed preference
@app.route('/api/preferences', methods=['POST'])
def save_preferences():
    # Get user_id from session
    user_id = flask.session.get('user', {}).get('user_id')
    if not user_id:
        return flask.jsonify({'error': 'Not authenticated'}), 401
    
    data = flask.request.get_json()
    genres = data.get('prefs', [])
    vec = init_weight_vector_from_prefs(genres)

    # Update weight vector in users table
    sql_cmd(
        "UPDATE users SET weight_vector = %s WHERE user_id = %s",
        (json.dumps(vec), user_id)
    )
    
    # Create user_profile entry (marks preferences as completed)
    sql_cmd(
        """INSERT INTO user_profiles (user_id, weight_vector) 
           VALUES (%s, %s)
           ON CONFLICT (user_id) DO UPDATE 
           SET weight_vector = EXCLUDED.weight_vector""",
        (user_id, json.dumps(vec))
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


@app.route("/api/user/upload-pfp", methods=["POST"])
def upload_pfp():
    user = session.get("user")
    if not user:
        return jsonify({"error": "not logged in"}), 401
    
    file = request.files.get("picture")
    result = cloudinary.uploader.upload(file)
    url = result["secure_url"]

    sql_cmd("UPDATE users SET user_image_url = %s WHERE user_id = %s", [url, user["user_id"]])
    return jsonify({"url": url})

# check we are logged in..
@app.route('/api/me')
def me():
    user = session.get("user")
    if user:
        return jsonify({ "user_id": user["user_id"] })
    return jsonify({ "error": "not logged in" }), 401

if __name__ == "__main__":
    # Get port from environment (Render sets this), default to 5000 for local dev
    port = int(os.environ.get("PORT", 5000))
    # Disable debug mode in production (when not on localhost)
    debug_mode = "localhost" in os.environ.get("FRONTEND_URL", "")
    app.run(host="0.0.0.0", port=port, debug=debug_mode)