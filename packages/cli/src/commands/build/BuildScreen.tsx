import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import * as esbuild from "esbuild";
import { buildServer } from "./buildServer";
import { formatTimingsTable, TYPECHECK_START } from "./formatBuildTimings";
import { typecheckServerEntry } from "./typecheckServerEntry";
import { displayPath } from "../../lib/displayPath";
import { isObject } from "../../lib/isObject";
import type { LogEvent, LogListener, PhaseLogEvent } from "../../log/event";
import { transcriptFromEvents } from "../../log/event";
import { palette } from "../../log/palette";
import { Status } from "../../components/Status";
import { done } from "../shared/done";
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

export const BuildScreen = ({ config, warning }: ScreenProps) => {
    const logEventsRef = useRef<LogEvent[]>([]);
    const [statusEvents, setStatusEvents] = useState<LogEvent[]>([]);
    const { data, isSuccess, mutate } = useMutation({
        mutationFn: (buildConfig: ScreenProps["config"]) => {
            logEventsRef.current = [];

            return runBuildCommand(buildConfig, (event) => {
                logEventsRef.current.push(event);

                if (event.type === "status") {
                    setStatusEvents((previous) => [...previous, event]);
                }
            });
        },
        onError: (caught: unknown) => {
            const transcript = transcriptFromEvents(logEventsRef.current);
            const message =
                caught instanceof Error ? caught.message : "Failed to build the io server.";

            done({
                code: 1,
                stderr: transcript.length > 0 ? `${transcript}${message}` : message,
            });
        },
    });

    useEffect(() => {
        if (!isSuccess || !data) return;

        const transcript = transcriptFromEvents(logEventsRef.current);

        done({
            code: 0,
            stderr: transcript.length > 0 ? `${transcript}${data.timings}` : data.timings,
            stdout: data.artifact,
        });
    }, [data, isSuccess]);

    useEffect(() => {
        mutate(config);
    }, [config, mutate]);

    const status = statusLabel(
        statusEvents,
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
            <Status active={!isSuccess} label={status} />
        </box>
    );
};
