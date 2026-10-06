type CounterSpan = { start: number; end: number };

/**
 * Counter ranges from Loro imports that are still waiting on earlier changes.
 */
export class PendingSpans {
    private readonly _spans = new Map<string, CounterSpan[]>();

    public get isPending(): boolean {
        return this._spans.size > 0;
    }

    public record(status: {
        pending: Map<unknown, CounterSpan> | null;
        success: Map<unknown, CounterSpan>;
    }): void {
        status.pending?.forEach((span, peer) => {
            const key = String(peer);
            const existing = this._spans.get(key) ?? [];

            this._spans.set(key, this._mergeSpans([...existing, span]));
        });
        status.success.forEach((span, peer) => {
            const key = String(peer);
            const existing = this._spans.get(key);

            if (!existing) return;

            const remaining = existing.flatMap((pending) => this._subtractSpan(pending, span));

            if (remaining.length) this._spans.set(key, remaining);
            else this._spans.delete(key);
        });
    }

    private _mergeSpans(spans: readonly CounterSpan[]): CounterSpan[] {
        return spans
            .filter((span) => span.end > span.start)
            .toSorted((left, right) => left.start - right.start)
            .reduce<CounterSpan[]>((merged, span) => {
                const last = merged.at(-1);

                if (!last || span.start > last.end) {
                    merged.push({ start: span.start, end: span.end });
                    return merged;
                }

                last.end = Math.max(last.end, span.end);
                return merged;
            }, []);
    }

    private _subtractSpan(span: CounterSpan, cover: CounterSpan): CounterSpan[] {
        if (cover.end <= span.start || cover.start >= span.end) return [span];

        const remaining: CounterSpan[] = [];

        if (cover.start > span.start) remaining.push({ start: span.start, end: cover.start });
        if (cover.end < span.end) remaining.push({ start: cover.end, end: span.end });

        return remaining;
    }
}
