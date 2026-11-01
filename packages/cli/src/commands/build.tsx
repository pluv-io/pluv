import { relative, isAbsolute } from "node:path";
import { useEffect, useState } from "react";
import { Text } from "ink";
import { argument } from "pastel";
import { z } from "zod";
import * as esbuild from "esbuild";
import { useConfig } from "../hooks/useConfig";
import { buildServer } from "../command/build/buildServer";

export const description = "Bundle the io server for a hosted platform";

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

export const options = z.object({});

const displayEntry = (cwd: string, entry: string): string => {
    const fromCwd = relative(cwd, entry);

    if (!fromCwd || fromCwd.startsWith("..") || isAbsolute(fromCwd)) return entry;

    return `./${fromCwd}`;
};

const displayOutput = (cwd: string, outfile: string): string => {
    const fromCwd = relative(cwd, outfile);

    if (!fromCwd || fromCwd.startsWith("..") || isAbsolute(fromCwd)) return outfile;

    return fromCwd;
};

const formatBuildError = async (error: unknown): Promise<string> => {
    if (
        typeof error === "object" &&
        error !== null &&
        "errors" in error &&
        Array.isArray(error.errors)
    ) {
        const messages = await esbuild.formatMessages(error.errors as esbuild.Message[], {
            color: false,
            kind: "error",
        });
        const text = messages.join("").trim();

        if (text) return text;
    }

    return error instanceof Error ? error.message : "Failed to build the io server.";
};

export default function Build() {
    const config = useConfig();
    const [status, setStatus] = useState("Building");

    useEffect(() => {
        let stopped = false;

        void buildServer({
            cwd: process.cwd(),
            entry: config.entry,
            distDir: config.distDir,
        })
            .then((outfile) => {
                if (stopped) return;

                process.stderr.write(
                    [
                        `entry    ${displayEntry(process.cwd(), config.entry)}`,
                        `built    ${displayOutput(process.cwd(), outfile)}`,
                        "",
                    ].join("\n"),
                );
                setStatus("Built");
                process.exit(0);
            })
            .catch(async (error: unknown) => {
                const text = await formatBuildError(error);

                process.stderr.write(`${text}\n`);
                process.exit(1);
            });

        return () => {
            stopped = true;
        };
    }, [config]);

    return <Text>{`pluv build · ${displayEntry(process.cwd(), config.entry)} · ${status}`}</Text>;
}
