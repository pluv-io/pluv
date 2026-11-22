import { describe, expect, it } from "vitest";
import { formatTimingsTable } from "../../src/commands/build/formatBuildTimings";
import type { PhaseLogEvent } from "../../src/log/event";

const phase = (id: PhaseLogEvent["id"], label: string, durationMs: number): PhaseLogEvent => {
    return { type: "phase", id, label, durationMs };
};

describe("formatTimingsTable", () => {
    it("lists the bundle when typecheck was skipped", () => {
        expect(formatTimingsTable([phase("bundle", "Bundle", 45)])).toBe(
            ["  Phase   Time", "  Bundle  45ms", "  Total   45ms"].join("\n"),
        );
    });

    it("lists TypeScript, the bundle, and the total", () => {
        expect(
            formatTimingsTable([
                phase("typescript", "TypeScript", 120),
                phase("bundle", "Bundle", 45),
            ]),
        ).toBe(
            [
                "  Phase        Time",
                "  TypeScript  120ms",
                "  Bundle       45ms",
                "  Total       165ms",
            ].join("\n"),
        );
    });
});
