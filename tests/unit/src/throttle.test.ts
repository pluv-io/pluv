import { __internal } from "@pluv/io";
import { describe, expect, it, vi } from "vitest";

describe("throttle", () => {
    it("invokes immediately, then once more with the trailing call", async () => {
        vi.useFakeTimers();

        try {
            const calls: number[] = [];
            const scheduled = __internal.throttle(
                () => {
                    calls.push(calls.length + 1);
                },
                { wait: 150 },
            );

            scheduled.schedule();
            await vi.advanceTimersByTimeAsync(0);
            scheduled.schedule();
            scheduled.schedule();

            expect(calls).toEqual([1]);

            await vi.advanceTimersByTimeAsync(150);

            expect(calls).toEqual([1, 2]);
        } finally {
            vi.useRealTimers();
        }
    });

    it("cancel drops a pending trailing invoke", async () => {
        vi.useFakeTimers();

        try {
            const fn = vi.fn();
            const scheduled = __internal.throttle(fn, { wait: 150 });

            scheduled.schedule();
            await vi.advanceTimersByTimeAsync(0);
            scheduled.schedule();
            scheduled.cancel();

            await vi.advanceTimersByTimeAsync(150);

            expect(fn).toHaveBeenCalledTimes(1);
        } finally {
            vi.useRealTimers();
        }
    });

    it("leads again after the window", async () => {
        vi.useFakeTimers();

        try {
            const fn = vi.fn();
            const scheduled = __internal.throttle(fn, { wait: 150 });

            scheduled.schedule();
            await vi.advanceTimersByTimeAsync(0);
            await vi.advanceTimersByTimeAsync(150);
            scheduled.schedule();
            await vi.advanceTimersByTimeAsync(0);

            expect(fn).toHaveBeenCalledTimes(2);
        } finally {
            vi.useRealTimers();
        }
    });
});
