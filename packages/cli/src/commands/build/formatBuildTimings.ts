import type { PhaseLogEvent } from "../../log/event";

export const TYPECHECK_START = "Checking validity of types ...";

/** Phase rows plus a total, aligned with spaces. */
export const formatTimingsTable = (phases: readonly PhaseLogEvent[]): string => {
    const total = phases.reduce((sum, phase) => sum + phase.durationMs, 0);
    const rows = [
        ...phases.map((phase) => [phase.label, `${phase.durationMs}ms`] as const),
        ["Total", `${total}ms`] as const,
    ];
    const phaseWidth = Math.max("Phase".length, ...rows.map((row) => row[0].length));
    const timeWidth = Math.max("Time".length, ...rows.map((row) => row[1].length));
    const line = (left: string, right: string): string => {
        return `  ${left.padEnd(phaseWidth)}  ${right.padStart(timeWidth)}`;
    };

    return [line("Phase", "Time"), ...rows.map(([left, right]) => line(left, right))].join("\n");
};
