import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import * as esbuild from "esbuild";
import { buildServer } from "./buildServer";
import { displayPath } from "../../lib/displayPath";
import { isObject } from "../../lib/isObject";
import { errorText } from "../../lib/exit";
import { Status } from "../../components/Status";
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

/** Bundle the server module and return the entry and output lines. */
export const runBuildCommand = async (config: ScreenProps["config"]): Promise<string> => {
    try {
        const outfile = await buildServer({
            cwd: process.cwd(),
            distDir: config.distDir,
            entry: config.entry,
        });

        return [
            `entry    ${displayPath(process.cwd(), config.entry, true)}`,
            `built    ${displayPath(process.cwd(), outfile)}`,
        ].join("\n");
    } catch (caught) {
        throw new Error(await formatBuildError(caught), { cause: caught });
    }
};

export const BuildScreen = ({ config, done, warning }: ScreenProps) => {
    const { isSuccess, mutate } = useMutation({
        mutationFn: runBuildCommand,
        onError: (caught: unknown) => {
            done(errorText(caught, "Failed to build the io server."), 1);
        },
        onSuccess: (text) => {
            done(text, 0);
        },
    });

    useEffect(() => {
        mutate(config);
    }, [config, mutate]);

    const label = isSuccess ? "Built" : "Building";

    return (
        <box style={{ flexDirection: "column", padding: 1 }}>
            {warning ? <text fg="#888888">{warning}</text> : null}
            <text>{`pluv build · ${displayPath(process.cwd(), config.entry, true)}`}</text>
            <Status label={label} />
        </box>
    );
};
