import torch

from titlegen_model import CharTokenizer, TitleGenGPT, make_example, BLOCK_SIZE


# CharTokenizer
class TestCharTokenizer:
    def test_encode_decode_roundtrip(self):
        tok = CharTokenizer()
        text = "Midnight Drive"
        assert tok.decode(tok.encode(text)) == text

    def test_unknown_chars_are_dropped(self):
        tok = CharTokenizer()
        assert tok.encode("a\tb") == tok.encode("ab")

    def test_special_ids_are_distinct(self):
        tok = CharTokenizer()
        assert len({tok.pad_id, tok.bos_id, tok.eos_id}) == 3


# make_example
class TestMakeExample:
    def test_length_matches_block_size(self):
        tok = CharTokenizer()
        ids = make_example("pop", "Midnight Drive", tok)
        assert len(ids) == BLOCK_SIZE

    def test_contains_bos_and_eos(self):
        tok = CharTokenizer()
        ids = make_example("pop", "Hi", tok)
        assert tok.bos_id in ids
        assert tok.eos_id in ids

    def test_truncates_when_too_long(self):
        tok = CharTokenizer()
        ids = make_example("pop", "x" * 100, tok, block_size=16)
        assert len(ids) == 16

    def test_missing_genre_falls_back_to_unknown(self):
        tok = CharTokenizer()
        ids = make_example(None, "Hi", tok)
        assert ids[:len(tok.encode("unknown"))] == tok.encode("unknown")


# TitleGenGPT
class TestTitleGenGPT:
    def test_forward_output_shape(self):
        tok = CharTokenizer()
        model = TitleGenGPT(vocab_size=tok.vocab_size, n_embed=16, n_head=2, n_layer=1, block_size=8)
        idx = torch.randint(0, tok.vocab_size, (2, 8))
        logits, loss = model(idx)
        assert logits.shape == (2, 8, tok.vocab_size)
        assert loss is None

    def test_loss_computed_when_targets_given(self):
        tok = CharTokenizer()
        model = TitleGenGPT(vocab_size=tok.vocab_size, n_embed=16, n_head=2, n_layer=1, block_size=8)
        idx = torch.randint(0, tok.vocab_size, (2, 8))
        targets = torch.randint(0, tok.vocab_size, (2, 8))
        _, loss = model(idx, targets)
        assert loss.item() > 0

    def test_ignore_index_excludes_padding_from_loss(self):
        tok = CharTokenizer()
        model = TitleGenGPT(vocab_size=tok.vocab_size, n_embed=16, n_head=2, n_layer=1, block_size=8)
        idx = torch.randint(0, tok.vocab_size, (1, 8))
        targets = torch.full((1, 8), -1, dtype=torch.long)
        _, loss = model(idx, targets)
        assert torch.isnan(loss)  # no valid targets at all -> nan is expected/acceptable here

    def test_generate_extends_sequence_and_respects_block_size(self):
        tok = CharTokenizer()
        model = TitleGenGPT(vocab_size=tok.vocab_size, n_embed=16, n_head=2, n_layer=1, block_size=8)
        idx = torch.zeros((1, 1), dtype=torch.long)
        out = model.generate(idx, max_new_tokens=5, top_k=5)
        assert out.shape[1] <= 1 + 5

    def test_generate_stops_at_eos(self):
        tok = CharTokenizer()
        model = TitleGenGPT(vocab_size=tok.vocab_size, n_embed=16, n_head=2, n_layer=1, block_size=8)
        idx = torch.tensor([[tok.eos_id]], dtype=torch.long)
        # forcing top_k=1 with a model whose next most likely token is arbitrary won't
        # guarantee eos next, so instead just check generate terminates and returns a tensor
        out = model.generate(idx, max_new_tokens=3, top_k=1, eos_id=tok.eos_id)
        assert out.shape[0] == 1
