import { PendingRequestManager } from "../../../packages/client/src/PendingRequestManager";
import { describe, expect, it, vi } from "vitest";

describe("PendingRequestManager", () => {
    it("resolves overlapping requests by id and ignores unrelated completions", async () => {
        vi.useFakeTimers();

        try {
            const pending = new PendingRequestManager();
            const first = pending.request({
                onAbort: () => "abort-a",
                onTimeout: () => "timeout-a",
                timeoutMs: 10_000,
            });
            const second = pending.request({
                onAbort: () => "abort-b",
                onTimeout: () => "timeout-b",
                timeoutMs: 10_000,
            });

            expect(pending.complete(second.requestId, "page-b")).toBe(true);
            expect(pending.complete("missing", "nope")).toBe(false);
            await expect(second.promise).resolves.toBe("page-b");
            expect(pending.size).toBe(1);

            await vi.advanceTimersByTimeAsync(10_000);

            await expect(first.promise).resolves.toBe("timeout-a");
            expect(pending.size).toBe(0);
        } finally {
            vi.useRealTimers();
        }
    });

    it("failAll settles every waiter with its own abort result", async () => {
        const pending = new PendingRequestManager();
        const first = pending.request({
            onAbort: () => "closed-a",
            onTimeout: () => "timeout",
            timeoutMs: 10_000,
        });
        const second = pending.request({
            onAbort: () => "closed-b",
            onTimeout: () => "timeout",
            timeoutMs: 10_000,
        });

        pending.failAll();

        await expect(first.promise).resolves.toBe("closed-a");
        await expect(second.promise).resolves.toBe("closed-b");
        expect(pending.size).toBe(0);
    });
});
