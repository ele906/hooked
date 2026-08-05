"""
visualize_schema.py
Renders an ER diagram of schema.sql and saves it as a PNG.

Usage:
    python visualize_schema.py
"""

import os
import tempfile

MERMAID = """\
erDiagram
    users {
        SERIAL      user_id         PK
        TEXT        email           UK
        TEXT        username        UK
        TEXT        password_hash
        BOOLEAN     email_verified
        TIMESTAMP   created_at
        TEXT        user_image_url
    }

    artists {
        SERIAL  artist_id   PK
        TEXT    artist_name UK
    }

    songs {
        SERIAL      song_id         PK
        TEXT        song_name
        TEXT        preview_mp3_url UK
        TEXT        song_image_url
        TEXT        genre
    }

    song_artists {
        INTEGER song_id     PK,FK
        INTEGER artist_id   PK,FK
    }

    interactions {
        SERIAL      interaction_id  PK
        INTEGER     user_id         FK
        INTEGER     song_id         FK
        VARCHAR     type
        TIMESTAMP   created_at
        TEXT        served_by
        TEXT        session_id
    }

    user_profiles {
        INTEGER     user_id         PK,FK
        JSONB       seed_genres
        TIMESTAMP   updated_at
    }

    friends {
        INTEGER     user_id     PK,FK
        INTEGER     friend_id   PK,FK
        TIMESTAMP   added_at
    }

    liked {
        INTEGER     user_id     PK,FK
        INTEGER     song_id     PK,FK
        TIMESTAMP   created_at
    }

    song_artists  }o--|| songs         : "song_id"
    song_artists  }o--|| artists       : "artist_id"
    interactions  }o--|| users         : "user_id"
    interactions  }o--|| songs         : "song_id"
    user_profiles ||--|| users         : "user_id"
    friends       }o--|| users         : "user_id (owner)"
    friends       }o--|| users         : "friend_id"
    liked         }o--|| users         : "user_id"
    liked         }o--|| songs         : "song_id"
"""

HTML = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Hooked — Schema Diagram</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;700&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <style>
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      background: #13131f;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      font-family: 'Outfit', sans-serif;
      color: #e0d7f7;
    }}
    .mermaid {{
      background: transparent;
      padding: 0;
    }}
    .mermaid svg {{
      font-family: 'Outfit', sans-serif !important;
      font-size: 20px !important;
    }}
  </style>
</head>
<body>
  <div class="mermaid">
{MERMAID}
  </div>
  <script>
    mermaid.initialize({{
      startOnLoad: true,
      theme: 'dark',
      er: {{ diagramPadding: 80, entityPadding: 30, useMaxWidth: false }},
      themeVariables: {{
        primaryColor: '#5b4fcf',
        primaryTextColor: '#ffffff',
        primaryBorderColor: '#a78bfa',
        lineColor: '#a78bfa',
        secondaryColor: '#3b2d8a',
        tertiaryColor: '#2a1f6b',
        edgeLabelBackground: '#1e1a3a',
        attributeBackgroundColorEven: '#2d2360',
        attributeBackgroundColorOdd: '#1e1a4a',
        fontFamily: 'Outfit, sans-serif'
      }}
    }});
  </script>
</body>
</html>
"""

OUTPUT_PNG = os.path.join(os.path.dirname(__file__), "schema_diagram.png")

def main():
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("playwright not found — installing...")
        import subprocess, sys
        subprocess.check_call([sys.executable, "-m", "pip", "install", "playwright", "-q"])
        subprocess.check_call([sys.executable, "-m", "playwright", "install", "chromium", "--quiet"])
        from playwright.sync_api import sync_playwright

    tmp = tempfile.NamedTemporaryFile(
        mode="w", suffix=".html", delete=False, encoding="utf-8"
    )
    tmp.write(HTML)
    tmp.close()
    url = f"file://{tmp.name}"

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 3200, "height": 2400}, device_scale_factor=2)
        page.goto(url)
        page.wait_for_selector(".mermaid svg", timeout=10000)
        page.wait_for_timeout(500)
        page.screenshot(path=OUTPUT_PNG, full_page=True)
        browser.close()

    os.unlink(tmp.name)
    print(f"Saved: {OUTPUT_PNG}")

if __name__ == "__main__":
    main()
