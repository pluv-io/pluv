import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import * as esbuild from "esbuild";
import { buildServer } from "./buildServer";
import { formatTimingsTable, TYPECHECK_START } from "./formatBuildTimings";
import { typecheckServerEntry } from "./typecheckServerEntry";
import { displayPath } from "../../lib/displayPath";
import { isObject } from "../../lib/isObject";
import { errorText } from "../../lib/exit";
import type { LogEvent, LogListener, PhaseLogEvent } from "../../log/event";
import { LogLine } from "../../components/LogLine";
import { palette } from "../../log/palette";
import { Status } from "../../components/Status";
import { TimingsTable } from "../../components/TimingsTable";
import type { ScreenProps } from "../shared/types";

const formatBuildError = async (error: unknown): Promise<string> => {
    if (isObject(error) && "errors" in error && Array.isArray(error.errors)) {
        const messages = await esbuild.formatMessages(error.errors as esbuild.Message[], {
            color: false,
            kind: "error",
        });
        const text = messages.join("").trim();

        if (text) return text;
    }

    return error instanceof Error ? error.message : "Failed to build the io server.";
};

export type BuildCommandResult = {
    /** `entry` and `built` lines for stdout. */
    artifact: string;
    /** Summary table of the phases that ran. */
    timings: string;
};

const emit = (onEvent: LogListener | undefined, event: LogEvent): void => {
    onEvent?.(event);
};

/** Typecheck the server module, then bundle it. Events describe the live output. */
export const runBuildCommand = async (
    config: ScreenProps["config"],
    onEvent?: LogListener,
): Promise<BuildCommandResult> => {
    const phases: PhaseLogEvent[] = [];

    try {
        if (!config.typescript.ignoreBuildErrors) {
            emit(onEvent, { type: "status", label: "Checking types" });
            emit(onEvent, { type: "output", text: `${TYPECHECK_START}\n`, tone: "muted" });

            const started = performance.now();

            await typecheckServerEntry({ cwd: process.cwd(), entry: config.entry });

            const typecheck: PhaseLogEvent = {
                type: "phase",
                id: "typescript",
                label: "TypeScript",
                durationMs: Math.round(performance.now() - started),
            };

            phases.push(typecheck);
            emit(onEvent, typecheck);
        }

        emit(onEvent, { type: "status", label: "Building" });

        const bundleStarted = performance.now();
        const outfile = await buildServer({
            cwd: process.cwd(),
            distDir: config.distDir,
            entry: config.entry,
        });
        const bundle: PhaseLogEvent = {
            type: "phase",
            id: "bundle",
            label: "Bundle",
            durationMs: Math.round(performance.now() - bundleStarted),
        };

        phases.push(bundle);
        emit(onEvent, bundle);

        return {
            artifact: [
                `entry    ${displayPath(process.cwd(), config.entry, true)}`,
                `built    ${displayPath(process.cwd(), outfile)}`,
            ].join("\n"),
            timings: formatTimingsTable(phases),
        };
    } catch (caught) {
        throw new Error(await formatBuildError(caught), { cause: caught });
    }
};

const statusLabel = (events: readonly LogEvent[], fallback: string, finished: boolean): string => {
    if (finished) return "Built";

    for (let index = events.length - 1; index >= 0; index -= 1) {
        const event = events[index];

        if (event?.type === "status") return event.label;
    }

    return fallback;
};

export const BuildScreen = ({ config, done, warning }: ScreenProps) => {
    const [events, setEvents] = useState<LogEvent[]>([]);
    const { isSuccess, mutate } = useMutation({
        mutationFn: (current: ScreenProps["config"]) => {
            return runBuildCommand(current, (event) => {
                setEvents((currentEvents) => [...currentEvents, event]);
            });
        },
        onError: (caught: unknown) => {
            done(errorText(caught, "Failed to build the io server."), 1);
        },
        onSuccess: (result) => {
            done(`${result.artifact}\n\n${result.timings}`, 0);
        },
    });

    useEffect(() => {
        mutate(config);
    }, [config, mutate]);

    const phases = events.filter((event): event is PhaseLogEvent => event.type === "phase");
    const lines = events.filter((event) => event.type === "output" || event.type === "error");
    const status = statusLabel(
        events,
        config.typescript.ignoreBuildErrors ? "Building" : "Checking types",
        isSuccess,
    );

    return (
        <box style={{ flexDirection: "column", padding: 1 }}>
            {warning ? <text fg={palette.muted}>{warning}</text> : null}
            <text>
                <span fg={palette.muted}>pluv build · </span>
                {displayPath(process.cwd(), config.entry, true)}
            </text>
            <Status label={status} />
            {lines.map((event, index) => (
                <LogLine key={index} event={event} />
            ))}
            {phases.length > 0 ? <TimingsTable phases={phases} /> : null}
        </box>
    );
};
