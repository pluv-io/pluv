import { TextTableRenderable, bold, fg, type TextChunk } from "@opentui/core";
import { extend } from "@opentui/react";
import type { PhaseLogEvent } from "../log/event";
import { palette } from "../log/palette";

declare module "@opentui/react" {
    interface OpenTUIComponents {
        "text-table": typeof TextTableRenderable;
    }
}

extend({ "text-table": TextTableRenderable });

const cell = (text: string): TextChunk[] => [{ __isChunk: true, text }];
const muted = fg(palette.muted);
const accent = fg(palette.accent);

/** Phase durations plus a total, derived from phase events. */
export const TimingsTable = ({ phases }: { phases: readonly PhaseLogEvent[] }) => {
    const total = phases.reduce((sum, phase) => sum + phase.durationMs, 0);

    return (
        <text-table
            columnWidthMode="content"
            content={[
                [[bold("Phase")], [bold("Time")]],
                ...phases.map((phase) => [cell(phase.label), [muted(`${phase.durationMs}ms`)]]),
                [[accent("Total")], [accent(`${total}ms`)]],
            ]}
        />
    );
};
