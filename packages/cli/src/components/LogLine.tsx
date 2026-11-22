import { assertExhaustive } from "../lib/assertExhaustive";
import type { LogEvent, LogTone } from "../log/event";
import { palette } from "../log/palette";

type LineEvent = Extract<LogEvent, { type: "output" | "error" }>;

const toneColor = (tone: LogTone): string => {
    switch (tone) {
        case "muted":
            return palette.muted;
        case "success":
            return palette.success;
        default:
            return assertExhaustive(tone);
    }
};

const lineColor = (event: LineEvent): string | undefined => {
    if (event.type === "error") return palette.error;
    if (!event.tone) return undefined;

    return toneColor(event.tone);
};

/** One output or error event. Untinted output keeps whatever color it already has. */
export const LogLine = ({ event }: { event: LineEvent }) => {
    const text = event.type === "output" ? event.text : event.message;
    const color = lineColor(event);

    if (!color) return <text>{text}</text>;

    return <text fg={color}>{text}</text>;
};
