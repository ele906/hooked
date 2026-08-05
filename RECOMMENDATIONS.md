# How Hooked recommends songs

*Draft content for a future "How it works" page in the app. Written as a standalone doc for now.*

Every time you swipe, Hooked is trying to answer one question: **out of every song we know about, which one are you most likely to like next?** We answer it by learning from the swiping patterns of everyone on the app — and for people too new to have a pattern yet, by starting from the genres they picked at signup.

## 1. Neural collaborative filtering — learning from everyone's swipes

The core of the system is a small neural network called **NeuMF** (Neural Matrix Factorization), from [He et al., 2017, "Neural Collaborative Filtering"](https://arxiv.org/abs/1708.05031). It learns a compact embedding for every user and every song purely from interaction history (likes, dislikes, favorites) — no metadata, no manual feature engineering, just patterns in who liked what. It combines two towers:
- A **matrix factorization** path, which learns how well a user's and song's embeddings line up via a dot product
- A small **multi-layer perceptron**, which learns non-linear interactions between the two embeddings that a plain dot product can't capture

Both paths are combined into a single learned score for "how likely is this user to like this song," trained on real swipe data with sampled negative examples for songs a user never saw — a standard technique for learning from implicit feedback (you only ever observe likes/dislikes, never an explicit rating). This is what "people who like *this* also tend to like *that*" actually means: a pattern that only becomes visible across many users' behavior, not from looking at any single song's attributes.

The model is trained offline (`data/train_cf.py`, not live during a swipe) and, once trained, scores every unseen song for a user directly — the best-scoring one gets served.

## 2. Cold start — genre picks fill in until CF has enough data

A brand-new user has no swipe history, so CF has nothing to learn from yet — that's true of any collaborative filtering system. Until a user crosses a minimum interaction threshold, we fall back to the genres they picked during onboarding: a plain SQL match against each song's genre tag, ranked by how popular the song is overall (most-liked first). No vectors, no model — just "you said you like hip-hop, here's a well-liked hip-hop song you haven't seen."

As soon as a user has swiped enough for the CF model to have learned something from their behavior specifically, recommendations shift over to that.

## 3. Exploration

At every tier, roughly 15% of requests are served a random song instead of the top-ranked pick — a simple **epsilon-greedy** strategy from multi-armed bandit problems. Without it, the app would only ever show you things that look like what you already liked (or picked at signup), and you'd never discover something that breaks the pattern.

## Why this order?

| Tier | Works for | Weakness |
|---|---|---|
| Neural CF | Users with enough swipe history | Nothing to learn from for brand-new users — the "cold start" problem |
| Genre preference | Brand-new users, from their first swipe | Only as good as a genre tag — no sense of *why* someone likes a song |
| Random exploration | Everyone, always mixed in | Not personalized by design — that's the point |

## Sources
- He, X., Liao, L., Zhang, H., Nie, L., Hu, X., & Chua, T. (2017). *Neural Collaborative Filtering.* [arXiv:1708.05031](https://arxiv.org/abs/1708.05031)
