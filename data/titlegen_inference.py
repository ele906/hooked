"""Lazy-loading inference wrapper around the trained title-generation model,
used by the backend to suggest a name for a freshly generated track. If no
trained artifacts exist yet (e.g. not enough songs to train on), suggestion
simply reports "unavailable" — the caller falls back to a static default.
"""
import os

import torch

from data.titlegen_model import CharTokenizer, TitleGenGPT

ARTIFACT_DIR = os.path.join(os.path.dirname(__file__), "titlegen_artifacts")

_model = None
_tokenizer = None
_load_attempted = False


def _load():
    global _model, _tokenizer, _load_attempted
    if _load_attempted:
        return
    _load_attempted = True

    model_path = os.path.join(ARTIFACT_DIR, "titlegen.pt")
    if not os.path.exists(model_path):
        return

    checkpoint = torch.load(model_path, weights_only=True)
    tokenizer = CharTokenizer()
    model = TitleGenGPT(vocab_size=checkpoint["vocab_size"])
    model.load_state_dict(checkpoint["state_dict"])
    model.eval()

    _model = model
    _tokenizer = tokenizer


def is_available():
    _load()
    return _model is not None


def suggest_title(genre, max_new_tokens=24, temperature=0.8, top_k=10):
    """Generates a song title suggestion conditioned on the given genre.
    Returns None if no trained model is available."""
    _load()
    if _model is None:
        return None

    genre = (genre or "unknown").lower().strip()
    prompt_ids = _tokenizer.encode(genre) + [_tokenizer.bos_id]
    idx = torch.tensor([prompt_ids], dtype=torch.long)

    out = _model.generate(
        idx, max_new_tokens=max_new_tokens, temperature=temperature,
        top_k=top_k, eos_id=_tokenizer.eos_id,
    )

    generated_ids = out[0, len(prompt_ids):].tolist()
    if _tokenizer.eos_id in generated_ids:
        generated_ids = generated_ids[:generated_ids.index(_tokenizer.eos_id)]

    title = _tokenizer.decode(generated_ids).strip()
    return title or None
