# Recommendation & generation pipeline

Three models, three different jobs. Collaborative filtering personalizes song recommendations,
a small char-level transformer generates song titles, and a pretrained transformer generates
audio clips. A tiered fallback system ties the first piece together so no single model's cold
start blocks the product.

---

## Architecture at a glance

```
User requests next song
        │
        ▼
  Has a trained CF embedding? ──No──▶ Genre match (seed_genres) ──No match──▶ Random / unseen
        │ Yes (85%)                          │                                       │
        ▼                                    ▼                                       ▼
   NeuMF score, argmax                  served_by = genre_preference          served_by = exploration
   served_by = cf
```

Every serve is tagged with `served_by`, so tier performance is measurable directly from
`interactions`. 15% epsilon-greedy exploration is mixed in at every tier — this is what feeds
fresh, non-self-confirming signal back into the next offline retrain.

---

## Model 1 — NeuMF (collaborative filtering)

**File:** `data/cf_model.py` · **Training:** `data/train_cf.py` · **Serving:** `backend/app.py: next_song`

Neural Collaborative Filtering (He et al., 2017). Fuses two towers that each learn their own
user/item embeddings from pure IDs — no metadata, no genre, no artist:

- **GMF path** — 16-dim user embedding × 16-dim item embedding, element-wise product. Classic
  matrix factorization, linear interactions only.
- **MLP path** — separate 16-dim user/item embeddings, concatenated (32-dim) → 3-layer MLP
  (32→16→8, ReLU). Learns nonlinear interaction patterns GMF structurally cannot represent.
- **Fusion** — GMF output (16-dim) + MLP output (8-dim) concatenated → `Linear(24, 1)` → sigmoid
  → a 0–1 "will they like this" score.

### Training

1. Pull raw `(user_id, song_id, type)` rows from `interactions`.
2. Drop users/songs with fewer than 5 interactions — below that, embeddings are mostly noise.
3. Build labeled pairs: like/favorite → positive (1.0), dislike → negative (0.0), plus 4
   randomly-sampled unobserved pairs per positive as implicit negatives — standard practice for
   implicit-feedback CF, since explicit "no" signal is rare.
4. `BCEWithLogitsLoss`, Adam (lr=0.01), 20 epochs, full-batch, no train/val split.
5. Weights + ID mappings saved to `data/cf_artifacts/`. Offline, manual job — rerun
   `python data/train_cf.py` periodically; the backend picks up new artifacts on next load.

### Cold start

- **New user** — no embedding yet, served via genre matching (Tier 2) until they cross 5
  interactions. Promotion to Tier 1 is not live — it happens on the next offline retrain.
- **New song** — same 5-interaction floor. Until then it can only surface via genre or
  exploration tiers, never CF scoring.

### Known limitations

- No validation split — no signal on overfitting the specific negative-sample draw.
- Full-batch, fixed lr=0.01, fixed 20 epochs, no early stopping.
- Cold-start promotion is offline-only, so the most active users get the least personalized
  experience for the longest.

---

## Model 2 — TitleGenGPT (song title generation)

**File:** `titlegen_model.py` · **Training:** `train_titlegen.py` · **Inference:** `titlegen_inference.py`

A tiny decoder-only transformer, char-level, trained from scratch on the app's own `songs`
table. Generates a song title conditioned on genre.

| Param | Value |
|---|---|
| Layers | 3 |
| Heads | 4 |
| Embed dim | 128 (32/head) |
| Context window | 48 chars |
| Vocab | 98 tokens (printable ASCII + PAD/BOS/EOS) |
| Params | ~600K — trains on CPU in seconds |

### How conditioning works

No separate genre embedding, no cross-attention. Genre is just text prepended to the sequence:

```
"pop" + <BOS> + "Midnight Drive" + <EOS>
```

Because attention is causal, every title character attends back to the genre characters that
came before it. "Genre conditioning" is really just prompt conditioning — the same trick behind
GPT-style control codes.

### Forward pass

1. Embed: token embedding + learned positional embedding, summed.
2. 3× transformer block, each: `x + attn(LN(x))` then `x + mlp(LN(x))` — pre-norm residual GPT
   block.
3. Attention: single `qkv` linear splits into 4 heads, scaled dot-product, causal mask
   (lower-triangular, blocks future chars), softmax, dropout, recombine.
4. MLP: 128 → 512 → GELU → 128.
5. Final LayerNorm + linear head → logits over the 98-char vocab.

### Training

- Data: `(genre, song_name)` rows pulled straight from `songs`.
- Standard next-token prediction: shift input by 1, target = next char.
- Padding positions get target = `-1`, excluded from loss via `ignore_index=-1`.
- 60 epochs, batch 64, AdamW @ 3e-4, no LR schedule, no train/val split, no mid-run
  checkpointing — trains and saves once at the end.
- Skips training entirely below 50 songs.

### Inference

- Lazy-loads `titlegen_artifacts/titlegen.pt` once, caches in module globals.
- Prompt = genre chars + `<BOS>`, then autoregressive sampling: temperature 0.8, top-k 10, stop
  at `<EOS>` or 24 tokens.
- Returns `None` if no artifact exists yet — caller falls back to a static title.

### Design choices

1. **Char-level, not word/BPE** — no tokenizer to train or ship separately; fixed 98-token
   vocab. Costs the model having to learn spelling from scratch, but titles are short (≤48
   chars) so that's cheap, and it sidesteps out-of-vocabulary issues with invented title words.
2. **Decoder-only, not encoder-decoder** — genre conditioning via text prefix rather than a
   separate encoder + cross-attention. One stream, one set of weights; the causal mask does the
   conditioning for free.
3. **Tiny (3 layers, 4 heads, 128 dim, ~600K params)** — sized to the dataset (hundreds to
   low-thousands of rows), not to some task ceiling. A GPT-2-sized model would overfit
   instantly and be pointless to train on CPU.
4. **Block size 48** — covers genre prefix + a realistic title with slack, without wasting
   attention compute on padding.
5. **Dropout 0.1 + top-k(10)/temperature(0.8) sampling** — dropout fights overfitting on a small
   dataset; top-k + temperature avoids both greedy decoding's repetitiveness and pure random
   sampling's garbage strings.
6. **Trained from scratch, not fine-tuned from a pretrained LLM** — no per-call API cost or
   latency, titles stay in-vocabulary with the app's actual genres and style. Tradeoff: needs
   ≥50 songs before it's useful at all.

### Sampling mechanics

- **Temperature** scales logits before softmax. Lower → sharper distribution → safer,
  repetitive titles. Higher → flatter → weirder, riskier titles. This model uses 0.8: mild,
  slightly conservative randomness.
- **Top-k** keeps only the k most likely next-characters, zeroes out the rest. `top_k=10` here
  puts a hard floor under how weird any single character choice can get, even if temperature
  alone would occasionally sample something low-probability.
- Together: top-k narrows the candidate pool to 10 plausible next-chars; temperature controls
  how evenly the pick is spread across those 10. The standard "creative but not insane"
  combination.

---

## Model 3 — MusicGen (audio generation)

**Model:** `facebook/musicgen-small`, via Hugging Face `transformers`. Pretrained — not trained
or fine-tuned in this project. Runs locally on CPU, no external API, no per-call cost.

### Loading

`_load_model()` loads the processor + model once into module-level globals. `preload_model()`
warms this eagerly at app startup so a user's first request doesn't pay the ~1–2GB weight-load
cost.

### Request flow

1. `build_prompt(genres, artist_names)` turns a user's seed genres into a text prompt, e.g.
   `"Original instrumental track, pop, indie style."` — capped at 4 genres, falls back to
   `"upbeat pop"` if none given.
2. `artist_names` is deliberately ignored. Naming real, identifiable artists asks a generative
   model to mimic their style and likeness — a real ethics/ToS concern independent of whether
   the feature is commercial — and it's also empirically a weaker MusicGen prompt than plain
   descriptive genre language.
3. `generate_music(prompt, seconds)` feeds the prompt through the processor, calls
   `model.generate()` capped at `MAX_DURATION_SECONDS = 8` (translated to tokens via
   `TOKENS_PER_SECOND = 50`, MusicGen's EnCodec frame rate), then encodes the raw audio as WAV
   bytes via `scipy.io.wavfile`.
4. Failures are wrapped in a `RuntimeError` so the calling route returns a clean HTTP error
   instead of a stack trace.

### Constraints

- 8-second clips on CPU take roughly a minute — the reason duration is hard-capped.
- No fine-tuning here. Genre-conditioned *text* generation (song titles) is a separate model —
  see Model 2 above. This is audio only.

---

## How the three fit together

- **Cold start → learned personalization → generative layer.** A new user gets genre-matched
  recommendations (Tier 2) since there's no behavioral history yet. Once they cross the
  interaction floor, NeuMF (Tier 1) takes over on the next retrain. Independently of either,
  MusicGen and TitleGenGPT generate net-new content (a clip, a title) conditioned on the same
  genre/taste signal, rather than recommending from the existing catalog.
- **Graceful degradation is the throughline.** Every tier has a fallback: CF falls back to
  genre, genre falls back to random exploration, title generation falls back to a static title,
  music generation surfaces a clean error instead of a stack trace. No single model's failure
  mode — untrained, understaffed on data, or simply erroring — breaks the product.
- **Epsilon-greedy exploration (15%)** runs inside the CF and genre tiers so the app doesn't
  converge onto a narrow, self-confirming set of recommendations. The classic explore/exploit
  tradeoff, and the mechanism that keeps feeding fresh signal into the next CF retrain.

---

## Future improvements

- Live CF cold-start promotion instead of offline-only retraining.
- Train/val split + early stopping for `train_cf.py`.
- Mini-batching for `train_cf.py` (currently full-batch).
- LLM-mediated style descriptors for MusicGen prompts (translate artist taste into descriptive
  audio language — tempo, instrumentation, mood — without naming real artists) as a richer
  alternative to genre-only prompts.
