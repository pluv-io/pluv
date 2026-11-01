import { spawn, type ChildProcess } from "node:child_process";
import { isAbsolute, relative } from "node:path";
import { useEffect, useState } from "react";
import { Text } from "ink";
import { argument, option } from "pastel";
import { z } from "zod";
import { useConfig } from "../hooks/useConfig";
import { devDir } from "../command/dev/devDir";
import { watchDevProject } from "../command/dev/watchDevProject";
import { wranglerBin } from "../command/dev/wranglerBin";

export const description = "Run a local room server for @pluv/platform";

export const args = z.tuple([
    z
        .string()
        .optional()
        .describe(
            argument({
                name: "entry",
                description:
                    "Server module. Overrides config entry. Default ./pluv.ts when no config file.",
            }),
        ),
]);

export const options = z.object({
    port: z
        .number()
        .int()
        .min(1)
        .max(65535)
        .optional()
        .describe(option({ description: "Listen port. Default 8787." })),
});

export type DevOptions = z.infer<typeof options>;

const displayEntry = (cwd: string, entry: string): string => {
    const fromCwd = relative(cwd, entry);

    if (!fromCwd || fromCwd.startsWith("..") || isAbsolute(fromCwd)) return entry;

    return `./${fromCwd}`;
};

const readyLog = (cwd: string, entry: string, port: number): string => {
    return [
        `entry    ${displayEntry(cwd, entry)}`,
        `ready    ws://127.0.0.1:${port}/api/pluv/room/<room>`,
    ].join("\n");
};

export default function Dev() {
    const config = useConfig();
    const [status, setStatus] = useState("Starting");

    useEffect(() => {
        let stopped = false;
        let child: ChildProcess | undefined;
        let stopWatch: (() => Promise<void>) | undefined;

        const report = (text: string): void => {
            process.stderr.write(`${text}\n`);

            if (!stopped) setStatus(text);
        };

        void watchDevProject(process.cwd(), config, {
            onReady: () => {
                if (stopped || child) return;

                setStatus("Ready");
                process.stderr.write(`${readyLog(process.cwd(), config.entry, config.port)}\n`);
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
                        stdio: "inherit",
                    },
                );

                child.on("exit", (code) => {
                    if (!stopped) process.exit(code ?? 0);
                });
            },
            onReload: () => {
                if (!stopped) setStatus("Reloaded the room module.");
            },
            onError: report,
        })
            .then((stop) => {
                stopWatch = stop;

                if (stopped) void stop();
            })
            .catch((error: unknown) => {
                report(error instanceof Error ? error.message : "Failed to build the room.");
            });

        return () => {
            stopped = true;
            void stopWatch?.();
            child?.kill("SIGTERM");
        };
    }, [config]);

    return (
        <Text>{`pluv dev · ws://127.0.0.1:${config.port}/api/pluv/room/<room> · ${status}`}</Text>
    );
}
