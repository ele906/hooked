"""
system_diagram.py
Renders the Hooked system architecture diagram in the browser.
No extra dependencies — uses the Mermaid JS CDN inside a local HTML file.

Usage:
    python system_diagram.py
"""

import os
import tempfile

MERMAID = """
flowchart TB
    subgraph CORE[" "]
        FE["Frontend\nReact"]
        BE["Backend\nFlask / Python"]
        DB[("PostgreSQL")]
    end

    GOOGLE["Google OAuth"]
    CLOUDINARY["Cloudinary"]
    GMAIL["Gmail SMTP"]
    ITUNES["iTunes API\n(seeding only)"]

    FE <-- "JSON responses" --> BE
    FE -- "REST + JWT" --> BE
    BE <-- "query results" --> DB
    BE -- "psycopg2 queries" --> DB
    FE -- "OAuth redirect" --> GOOGLE
    GOOGLE -- "user info" --> BE
    BE -- "image upload" --> CLOUDINARY
    CLOUDINARY -- "image URL" --> BE
    BE -- "verification emails" --> GMAIL
    ITUNES -. "song data (offline)" .-> BE

    style FE fill:#c4b5fd,color:#1a1a2e,stroke:#a78bfa,stroke-width:4px
    style BE fill:#67e8f9,color:#1a1a2e,stroke:#22d3ee,stroke-width:4px
    style DB fill:#c4b5fd,color:#1a1a2e,stroke:#a78bfa,stroke-width:4px
    style CORE fill:#1e1e3a,stroke:#a78bfa,stroke-width:2px,stroke-dasharray:6,color:#e0d7f7
    style GOOGLE fill:#2d2d4e,color:#e0d7f7,stroke:#4a4a7a
    style CLOUDINARY fill:#2d2d4e,color:#e0d7f7,stroke:#4a4a7a
    style GMAIL fill:#2d2d4e,color:#e0d7f7,stroke:#4a4a7a
    style ITUNES fill:#2d2d4e,color:#e0d7f7,stroke:#4a4a7a,stroke-dasharray:4
"""

HTML = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Hooked — System Diagram</title>
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
      font-size: 22px !important;
    }}
  </style>
</head>
<body>
  <div class="mermaid">
{MERMAID}
  </div>
  <script>
    mermaid.initialize({{ startOnLoad: true, theme: 'dark', flowchart: {{ curve: 'basis', nodeSpacing: 100, rankSpacing: 120, padding: 30, useMaxWidth: false }} }});
  </script>
</body>
</html>
"""

OUTPUT_PNG = os.path.join(os.path.dirname(__file__), "system_diagram.png")

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
        page = browser.new_page(viewport={"width": 2400, "height": 1600}, device_scale_factor=2)
        page.goto(url)
        # wait for mermaid to finish rendering
        page.wait_for_selector(".mermaid svg", timeout=10000)
        page.wait_for_timeout(500)
        page.screenshot(path=OUTPUT_PNG, full_page=True)
        browser.close()

    os.unlink(tmp.name)
    print(f"Saved: {OUTPUT_PNG}")

if __name__ == "__main__":
    main()
