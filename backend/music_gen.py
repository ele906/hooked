import io
import os
import scipy.io.wavfile
from transformers import AutoProcessor, MusicgenForConditionalGeneration

MUSICGEN_MODEL = os.environ.get("MUSICGEN_MODEL", "facebook/musicgen-small")
MAX_DURATION_SECONDS = 8  # shorter clip keeps CPU inference time down
TOKENS_PER_SECOND = 50  # MusicGen's EnCodec frame rate

_processor = None
_model = None


def _load_model():
    # Singleton — the ~1-2GB weights only need to load once per process.
    # Called eagerly at app startup (see app.py) so the download/load time
    # doesn't eat into a request's budget against the client/proxy timeouts.
    global _processor, _model
    if _model is None:
        _processor = AutoProcessor.from_pretrained(MUSICGEN_MODEL)
        _model = MusicgenForConditionalGeneration.from_pretrained(MUSICGEN_MODEL)
    return _processor, _model


def preload_model():
    """Warms the singleton model/processor. Call once at process startup."""
    _load_model()


def build_prompt(genres, artist_names, seconds=15):
    """Turn a user's seed genres + recently liked artists into a MusicGen text prompt."""
    parts = []
    if genres:
        parts.append(", ".join(genres[:4]) + " style")
    if artist_names:
        parts.append("in the spirit of " + ", ".join(artist_names[:3]))
    if not parts:
        parts.append("upbeat pop")
    return "Original instrumental track, " + "; ".join(parts) + "."


def generate_music(prompt: str, seconds=8) -> bytes:
    """Generates a short instrumental clip locally with Meta's MusicGen model.

    Runs on CPU via transformers/torch — no external API or cost, but slow
    (roughly a minute per clip). Weights are downloaded and cached on first use.
    Raises RuntimeError on failure so the route can turn it into a clean HTTP error.
    """
    seconds = min(seconds, MAX_DURATION_SECONDS)

    try:
        processor, model = _load_model()
        inputs = processor(text=[prompt], padding=True, return_tensors="pt")
        audio_values = model.generate(**inputs, max_new_tokens=int(seconds * TOKENS_PER_SECOND))

        audio = audio_values[0, 0].numpy()
        sampling_rate = model.config.audio_encoder.sampling_rate

        buffer = io.BytesIO()
        scipy.io.wavfile.write(buffer, rate=sampling_rate, data=audio)
        return buffer.getvalue()
    except Exception as e:
        raise RuntimeError(f"music generation failed: {e}") from e
