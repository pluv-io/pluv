import { spawn, type ChildProcess } from "node:child_process";
import { useEffect, useState } from "react";
import { devDir } from "./devDir";
import { watchDevProject } from "./watchDevProject";
import { wranglerBin } from "./wranglerBin";
import { displayPath } from "../../lib/displayPath";
import { Status } from "../../components/Status";
import type { PluvConfig } from "../../schemas";
import type { ScreenProps } from "../shared/types";

const readyLog = (cwd: string, entry: string, port: number): string => {
    return [
        `entry    ${displayPath(cwd, entry, true)}`,
        `ready    ws://127.0.0.1:${port}/api/pluv/room/<room>`,
    ].join("\n");
};

type DevHandlers = {
    onExit: (code: number) => void;
    onLog: (text: string) => void;
    onStatus: (text: string) => void;
    /** Pipe wrangler output through stdout so a split footer can keep it. */
    pipe: boolean;
};

/** Watch the room and run wrangler. `stop` ends both. */
export const startDev = (config: PluvConfig, handlers: DevHandlers): { stop: () => void } => {
    let stopped = false;
    let child: ChildProcess | undefined;
    let stopWatch: (() => Promise<void>) | undefined;

    const report = (text: string): void => {
        handlers.onStatus(text);
        handlers.onLog(`${text}\n`);
    };

    void watchDevProject(process.cwd(), config, {
        onError: report,
        onReady: () => {
            if (stopped || child) return;

            handlers.onStatus("Ready");
            handlers.onLog(`${readyLog(process.cwd(), config.entry, config.port)}\n`);
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
                    stdio: handlers.pipe ? ["inherit", "pipe", "pipe"] : "inherit",
                },
            );

            if (handlers.pipe) {
                child.stdout?.on("data", (chunk: Buffer) => {
                    process.stdout.write(chunk);
                });
                child.stderr?.on("data", (chunk: Buffer) => {
                    process.stdout.write(chunk);
                });
            }

            child.on("exit", (code) => {
                if (!stopped) handlers.onExit(code ?? 0);
            });
        },
        onReload: () => {
            if (stopped) return;

            handlers.onStatus("Reloaded the room module.");
            handlers.onLog("Reloaded the room module.\n");
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

export const DevScreen = ({ config, done, warning }: ScreenProps) => {
    const [status, setStatus] = useState("Starting");

    useEffect(() => {
        const session = startDev(config, {
            onExit: (code) => {
                done("", code);
            },
            onLog: (text) => {
                process.stdout.write(text);
            },
            onStatus: setStatus,
            pipe: true,
        });

        return () => {
            session.stop();
        };
    }, [config, done]);

    return (
        <box style={{ flexDirection: "column", paddingLeft: 1, paddingRight: 1 }}>
            {warning ? <text fg="#888888">{warning}</text> : null}
            <text>{`pluv dev · ws://127.0.0.1:${config.port}/api/pluv/room/<room>`}</text>
            <Status label={status} />
        </box>
    );
};
