"""Demo trace/span, percentile và token-cost hoàn toàn offline."""

from __future__ import annotations

from dataclasses import dataclass
import math


@dataclass(frozen=True)
class Span:
    """Một operation trong trace với thời gian và token usage."""

    trace_id: str
    span_id: str
    parent_id: str | None
    name: str
    start_ms: float
    end_ms: float
    input_tokens: int = 0
    output_tokens: int = 0
    status: str = "ok"

    @property
    def duration_ms(self) -> float:
        """Trả duration của span."""

        return self.end_ms - self.start_ms


@dataclass(frozen=True)
class RequestTrace:
    """Trace của một request cùng TTFT quan sát ở client."""

    spans: tuple[Span, ...]
    ttft_ms: float


def validate_trace(trace: RequestTrace) -> None:
    """Kiểm tra ID, một root và child nằm trong khoảng thời gian parent."""

    if not trace.spans:
        raise ValueError("Trace rỗng")
    by_id = {span.span_id: span for span in trace.spans}
    if len(by_id) != len(trace.spans):
        raise ValueError("span_id bị trùng")
    roots = [span for span in trace.spans if span.parent_id is None]
    if len(roots) != 1:
        raise ValueError("Trace phải có đúng một root")
    for span in trace.spans:
        if span.end_ms < span.start_ms:
            raise ValueError("Span có duration âm")
        if span.parent_id is not None:
            parent = by_id.get(span.parent_id)
            if parent is None:
                raise ValueError("Không tìm thấy parent span")
            if span.start_ms < parent.start_ms or span.end_ms > parent.end_ms:
                raise ValueError("Child span nằm ngoài parent")
    if trace.ttft_ms < 0 or trace.ttft_ms > roots[0].duration_ms:
        raise ValueError("TTFT nằm ngoài request")


def percentile(values: tuple[float, ...], quantile: float) -> float:
    """Tính percentile bằng nội suy tuyến tính trên index (n-1)*q."""

    if not values or not 0.0 <= quantile <= 1.0:
        raise ValueError("Cần values và quantile trong [0, 1]")
    ordered = sorted(values)
    position = (len(ordered) - 1) * quantile
    lower = math.floor(position)
    upper = math.ceil(position)
    if lower == upper:
        return ordered[lower]
    weight = position - lower
    return ordered[lower] * (1.0 - weight) + ordered[upper] * weight


def token_cost(
    input_tokens: int,
    output_tokens: int,
    *,
    input_per_million: float,
    output_per_million: float,
) -> float:
    """Quy đổi token sang cost theo rate giả lập trên một triệu token."""

    if min(input_tokens, output_tokens, input_per_million, output_per_million) < 0:
        raise ValueError("Token và rate không được âm")
    return (
        input_tokens * input_per_million + output_tokens * output_per_million
    ) / 1_000_000


def summarize(
    traces: tuple[RequestTrace, ...], *, input_rate: float, output_rate: float
) -> dict[str, float]:
    """Tổng hợp latency, TTFT, error rate, tokens và estimated cost."""

    if not traces:
        raise ValueError("Cần ít nhất một trace")
    for trace in traces:
        validate_trace(trace)
    roots = [next(span for span in trace.spans if span.parent_id is None) for trace in traces]
    latencies = tuple(root.duration_ms for root in roots)
    ttfts = tuple(trace.ttft_ms for trace in traces)
    all_spans = [span for trace in traces for span in trace.spans]
    input_tokens = sum(span.input_tokens for span in all_spans)
    output_tokens = sum(span.output_tokens for span in all_spans)
    failed = sum(root.status != "ok" for root in roots)
    return {
        "latency_p50_ms": percentile(latencies, 0.50),
        "latency_p95_ms": percentile(latencies, 0.95),
        "ttft_p95_ms": percentile(ttfts, 0.95),
        "error_rate": failed / len(roots),
        "input_tokens": float(input_tokens),
        "output_tokens": float(output_tokens),
        "estimated_cost": token_cost(
            input_tokens,
            output_tokens,
            input_per_million=input_rate,
            output_per_million=output_rate,
        ),
    }


def make_trace(trace_id: str, duration_ms: float, ttft_ms: float, *, failed: bool = False) -> RequestTrace:
    """Tạo trace giả lập gồm root, retrieval và model span."""

    root = Span(trace_id, "root", None, "agent.request", 0, duration_ms, status="error" if failed else "ok")
    retrieval_end = min(40.0, duration_ms * 0.3)
    retrieval = Span(trace_id, "retrieval", "root", "retrieve", 5, retrieval_end)
    model_start = retrieval_end
    model = Span(
        trace_id,
        "model",
        "root",
        "model.generate",
        model_start,
        duration_ms,
        input_tokens=1_000,
        output_tokens=200,
    )
    return RequestTrace((root, retrieval, model), ttft_ms)


def main() -> None:
    """Tổng hợp năm request và kiểm tra long-tail/cost."""

    traces = (
        make_trace("T1", 100, 35),
        make_trace("T2", 120, 40),
        make_trace("T3", 150, 45),
        make_trace("T4", 200, 60),
        make_trace("T5", 500, 180, failed=True),
    )
    metrics = summarize(traces, input_rate=2.0, output_rate=8.0)

    assert metrics["latency_p50_ms"] == 150
    assert math.isclose(metrics["latency_p95_ms"], 440.0)
    assert math.isclose(metrics["ttft_p95_ms"], 156.0)
    assert metrics["error_rate"] == 0.2
    assert metrics["input_tokens"] == 5_000
    assert abs(metrics["estimated_cost"] - 0.018) < 1e-12

    print("OBSERVABILITY SUMMARY")
    for name, value in metrics.items():
        print(f"{name}: {value:.6f}")


if __name__ == "__main__":
    main()
