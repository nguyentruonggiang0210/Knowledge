"""Bigram language model minh họa train, inference và decoding."""

from __future__ import annotations

import math
import random
from collections import Counter, defaultdict
from collections.abc import Mapping, Sequence

BigramModel = dict[str, Counter[str]]


def train_bigram(sentences: Sequence[str]) -> BigramModel:
    """Đếm next-token transitions, gồm BOS và EOS."""

    model: dict[str, Counter[str]] = defaultdict(Counter)
    for sentence in sentences:
        tokens = ["<BOS>", *sentence.lower().split(), "<EOS>"]
        for current, following in zip(tokens, tokens[1:]):
            model[current][following] += 1
    return dict(model)


def next_token_distribution(
    counts: Mapping[str, int], temperature: float, top_k: int | None = None
) -> list[tuple[str, float]]:
    """Chuyển count thành probability có temperature và optional top-k."""

    if not counts:
        return [("<EOS>", 1.0)]
    ranked = sorted(counts.items(), key=lambda item: (-item[1], item[0]))
    if top_k is not None:
        if top_k < 1:
            raise ValueError("top_k phải >= 1")
        ranked = ranked[:top_k]
    if temperature == 0:
        return [(ranked[0][0], 1.0)]
    if temperature < 0:
        raise ValueError("temperature không được âm")
    logits = [(token, math.log(count) / temperature) for token, count in ranked]
    maximum = max(logit for _, logit in logits)
    weights = [(token, math.exp(logit - maximum)) for token, logit in logits]
    total = sum(weight for _, weight in weights)
    return [(token, weight / total) for token, weight in weights]


def sample_token(distribution: Sequence[tuple[str, float]], rng: random.Random) -> str:
    """Sample một token từ categorical distribution."""

    threshold = rng.random()
    cumulative = 0.0
    for token, probability in distribution:
        cumulative += probability
        if threshold <= cumulative:
            return token
    return distribution[-1][0]


def generate(
    model: BigramModel,
    max_tokens: int,
    temperature: float = 0.0,
    top_k: int | None = None,
    seed: int = 0,
) -> str:
    """Autoregressive decode từ BOS tới EOS hoặc max token."""

    rng = random.Random(seed)
    current = "<BOS>"
    output: list[str] = []
    for _ in range(max_tokens):
        distribution = next_token_distribution(model.get(current, {}), temperature, top_k)
        following = sample_token(distribution, rng)
        if following == "<EOS>":
            break
        output.append(following)
        current = following
    return " ".join(output)


def corpus_negative_log_likelihood(model: BigramModel, sentences: Sequence[str]) -> float:
    """Tính NLL có add-one smoothing trên corpus."""

    vocabulary = {token for counts in model.values() for token in counts}
    losses: list[float] = []
    for sentence in sentences:
        tokens = ["<BOS>", *sentence.lower().split(), "<EOS>"]
        for current, following in zip(tokens, tokens[1:]):
            counts = model.get(current, Counter())
            probability = (counts.get(following, 0) + 1) / (sum(counts.values()) + len(vocabulary))
            losses.append(-math.log(probability))
    return sum(losses) / len(losses)


def run_demo() -> None:
    """Train autocomplete chào khách và so greedy với sampling."""

    corpus = [
        "xin chào bạn",
        "xin chào bạn",
        "xin chào quý khách",
        "cảm ơn bạn",
    ]
    model = train_bigram(corpus)
    greedy = generate(model, max_tokens=6, temperature=0.0)
    sampled = generate(model, max_tokens=6, temperature=0.8, top_k=2, seed=7)
    nll = corpus_negative_log_likelihood(model, corpus)

    assert greedy == "xin chào bạn"
    assert sampled
    assert math.isfinite(nll) and nll > 0
    assert next_token_distribution({"a": 3, "b": 1}, temperature=0.0) == [("a", 1.0)]
    print(f"greedy={greedy!a} sampled={sampled!a} corpus_nll={nll:.3f}")
    print("PASS: next-token training and bounded autoregressive decoding")


if __name__ == "__main__":
    run_demo()
