import { spawn, type ChildProcess } from "node:child_process";
import { useEffect, useState } from "react";
import { devDir } from "./devDir";
import { watchDevProject } from "./watchDevProject";
import { wranglerBin } from "./wranglerBin";
import { displayPath } from "../../lib/displayPath";
import type { LogEvent, LogListener } from "../../log/event";
import { LogLine } from "../../components/LogLine";
import { palette } from "../../log/palette";
import { Status } from "../../components/Status";
import type { PluvConfig } from "../../schemas";
import { done } from "../shared/done";
import type { ScreenProps } from "../shared/types";

type DevHandlers = {
    onExit: (code: number) => void;
    onEvent: LogListener;
};

/** Watch the room and run wrangler. `stop` ends both. */
export const startDev = (config: PluvConfig, handlers: DevHandlers): { stop: () => void } => {
    let stopped = false;
    let child: ChildProcess | undefined;
    let stopWatch: (() => Promise<void>) | undefined;

    const report = (text: string): void => {
        handlers.onEvent({ type: "status", label: text });
        handlers.onEvent({ type: "error", message: text });
    };

    void watchDevProject(process.cwd(), config, {
        onError: report,
        onReady: () => {
            if (stopped || child) return;

            handlers.onEvent({ type: "status", label: "Ready" });
            handlers.onEvent({
                type: "output",
                text: `entry    ${displayPath(process.cwd(), config.entry, true)}\n`,
                tone: "muted",
            });
            handlers.onEvent({
                type: "output",
                text: `ready    ws://127.0.0.1:${config.port}/api/pluv/room/<room>\n`,
                tone: "success",
            });
            child = spawn(
                process.execPath,
                [
                    wranglerBin(),
                    "dev",
                    "--config",
                    "wrangler.jsonc",
                    "--port",
                    String(config.port),
                    "--ip",
                    "127.0.0.1",
                ],
                {
                    cwd: devDir(process.cwd()),
                    stdio: ["inherit", "pipe", "pipe"],
                },
            );

            child.stdout?.on("data", (chunk: Buffer) => {
                handlers.onEvent({ type: "output", text: chunk.toString() });
            });
            child.stderr?.on("data", (chunk: Buffer) => {
                handlers.onEvent({ type: "output", text: chunk.toString() });
            });

            child.on("exit", (code) => {
                if (!stopped) handlers.onExit(code ?? 0);
            });
        },
        onReload: () => {
            if (stopped) return;

            handlers.onEvent({ type: "status", label: "Reloaded the room module." });
            handlers.onEvent({
                type: "output",
                text: "Reloaded the room module.\n",
                tone: "muted",
            });
        },
    })
        .then((stop) => {
            stopWatch = stop;

            if (stopped) void stop();
        })
        .catch((caught: unknown) => {
            report(caught instanceof Error ? caught.message : "Failed to build the room.");
        });

    const onSigint = (): void => {
        if (stopped) return;

        stopped = true;
        void stopWatch?.();
        child?.kill("SIGTERM");
        handlers.onExit(130);
    };

    process.on("SIGINT", onSigint);

    return {
        stop: () => {
            stopped = true;
            process.off("SIGINT", onSigint);
            void stopWatch?.();
            child?.kill("SIGTERM");
        },
    };
};

const latestStatus = (events: readonly LogEvent[]): string => {
    for (let index = events.length - 1; index >= 0; index -= 1) {
        const event = events[index];

        if (event?.type === "status") return event.label;
    }

    return "Starting";
};

export const DevScreen = ({ config, warning }: ScreenProps) => {
    const [events, setEvents] = useState<LogEvent[]>([]);

    useEffect(() => {
        const session = startDev(config, {
            onExit: (code) => {
                done({ code });
            },
            onEvent: (event) => {
                setEvents((current) => [...current, event]);
            },
        });

        return () => {
            session.stop();
        };
    }, [config]);

    const lines = events.filter((event) => event.type === "output" || event.type === "error");

    return (
        <box style={{ flexDirection: "column", flexGrow: 1, paddingLeft: 1, paddingRight: 1 }}>
            {warning ? <text fg={palette.muted}>{warning}</text> : null}
            <text>
                <span fg={palette.muted}>pluv dev · </span>
                {`ws://127.0.0.1:${config.port}/api/pluv/room/<room>`}
            </text>
            <Status label={latestStatus(events)} />
            <scrollbox style={{ flexGrow: 1 }}>
                {lines.map((event, index) => (
                    <LogLine key={index} event={event} />
                ))}
            </scrollbox>
        </box>
    );
};
