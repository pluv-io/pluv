import { assertExhaustive } from "../lib/assertExhaustive";

/** How a screen should color an output line. Headless printing ignores this. */
export type LogTone = "muted" | "success";

/** A line of work a command can show in the terminal or in an OpenTUI screen. */
export type LogEvent =
    | { type: "status"; label: string }
    | { type: "phase"; id: "typescript" | "bundle"; label: string; durationMs: number }
    | { type: "output"; text: string; tone?: LogTone }
    | { type: "error"; message: string };

export type LogListener = (event: LogEvent) => void;

export type PhaseLogEvent = Extract<LogEvent, { type: "phase" }>;

const phaseLabel = (id: PhaseLogEvent["id"]): string => {
    switch (id) {
        case "typescript":
            return "Finished TypeScript";
        case "bundle":
            return "Finished bundle";
        default:
            return assertExhaustive(id);
    }
};

/** Headless text for one event. Status stays on the screen spinner. Output is written as-is. */
export const formatLogEvent = (event: LogEvent): string | null => {
    switch (event.type) {
        case "status":
            return null;
        case "phase":
            return `${phaseLabel(event.id)} in ${event.durationMs}ms`;
        case "output":
            return event.text;
        case "error":
            return event.message.endsWith("\n") ? event.message : `${event.message}\n`;
        default:
            return assertExhaustive(event);
    }
};

const formatLogLine = (event: LogEvent, text: string): string => {
    if (event.type === "output") return text;

    return text.endsWith("\n") ? text : `${text}\n`;
};

/** Headless transcript for one or more events. Status lines are omitted. */
export const transcriptFromEvents = (events: readonly LogEvent[]): string => {
    let text = "";

    for (const event of events) {
        const line = formatLogEvent(event);

        if (line === null || line.length === 0) continue;

        text += formatLogLine(event, line);
    }

    return text;
};

/** Write one event to stderr. Output keeps its own newlines so streamed chunks stay intact. */
export const writeLogEvent = (event: LogEvent): void => {
    const text = formatLogEvent(event);

    if (text === null || text.length === 0) return;

    process.stderr.write(formatLogLine(event, text));
};
