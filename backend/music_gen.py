import os
import time
import requests

MAX_DURATION_SECONDS = 8  # shorter clip keeps generation cost/time down

REPLICATE_API_TOKEN = os.environ.get("REPLICATE_API_TOKEN")
# meta/musicgen is a community (non-"official") model, so it only supports the
# versioned /v1/predictions endpoint, not the /v1/models/{owner}/{name}/predictions
# shorthand. Pin a version so behavior doesn't shift under us; override via env
# if Replicate publishes a new version.
REPLICATE_MODEL_VERSION = os.environ.get(
    "REPLICATE_MODEL_VERSION",
    "671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb",
)
# Of the variants this wrapper exposes (stereo-melody-large, stereo-large,
# melody-large, large), "large" is mono/no-melody-conditioning — the cheapest
# and fastest of the four (there's no "small" in this Replicate wrapper).
REPLICATE_MODEL_VERSION_NAME = os.environ.get("REPLICATE_MODEL_VERSION_NAME", "large")
REPLICATE_POLL_INTERVAL_SECONDS = 1


def build_prompt(genres, artist_names, seconds=15):
    """Turn a user's seed genres into a MusicGen text prompt.

    Deliberately ignores artist_names: naming real artists asks the model to
    mimic their style/likeness, which is both an ethics/ToS problem and a
    weaker prompt for MusicGen than plain descriptive genre language.
    """
    parts = []
    if genres:
        parts.append(", ".join(genres[:4]) + " style")
    if not parts:
        parts.append("upbeat pop")
    return "Original instrumental track, " + "; ".join(parts) + "."


def generate_music(prompt: str, seconds=8) -> bytes:
    """Generates a short instrumental clip via Replicate's hosted MusicGen.

    Runs on Replicate's infra (GPU, billed per second) instead of loading the
    ~1-2GB model locally, so the web service's memory footprint stays small.
    Raises RuntimeError on failure so the route can turn it into a clean HTTP error.
    """
    if not REPLICATE_API_TOKEN:
        raise RuntimeError("music generation failed: REPLICATE_API_TOKEN is not set")

    seconds = min(seconds, MAX_DURATION_SECONDS)
    headers = {
        "Authorization": f"Bearer {REPLICATE_API_TOKEN}",
        "Content-Type": "application/json",
        # Ask Replicate to hold the request open and resolve synchronously when
        # it can (up to ~60s); we still poll below as a fallback for slower runs.
        "Prefer": "wait",
    }
    payload = {
        "version": REPLICATE_MODEL_VERSION,
        "input": {
            "prompt": prompt,
            "duration": seconds,
            "output_format": "wav",
            "model_version": REPLICATE_MODEL_VERSION_NAME,
        },
    }

    try:
        resp = requests.post(
            "https://api.replicate.com/v1/predictions",
            headers=headers, json=payload, timeout=120,
        )
        resp.raise_for_status()
        prediction = resp.json()

        while prediction["status"] not in ("succeeded", "failed", "canceled"):
            time.sleep(REPLICATE_POLL_INTERVAL_SECONDS)
            poll = requests.get(prediction["urls"]["get"], headers=headers, timeout=30)
            poll.raise_for_status()
            prediction = poll.json()

        if prediction["status"] != "succeeded":
            raise RuntimeError(prediction.get("error") or f"prediction {prediction['status']}")

        audio_url = prediction["output"]
        if isinstance(audio_url, list):
            audio_url = audio_url[0]

        audio_resp = requests.get(audio_url, timeout=60)
        audio_resp.raise_for_status()
        return audio_resp.content
    except Exception as e:
        raise RuntimeError(f"music generation failed: {e}") from e
