import { Newline, Text } from "ink";
import Spinner from "ink-spinner";
import React, { FC } from "react";
import { ErrorFlag, Filename } from "../components/index.js";
import { useBuildApp, useConfig } from "../hooks/index.js";
import { z } from "zod";
import { argument } from "pastel";

export const args = z
    .tuple([
        z
            .string()
            .optional()
            .describe(
                argument({
                    name: "input",
                    description: "input from pluv.config.js",
                }),
            ),
    ])
    .optional();

interface Props {
    args: z.output<typeof args>;
}

const Command: FC<Props> = ({ args }) => {
    const { input, outDir } = useConfig();
    const { error, isLoading } = useBuildApp({
        input,
        outDir: args?.[0] ?? outDir,
    });

    return (
        <Text>
            {isLoading && (
                <Text color="#6366f1">
                    <Spinner type="dots" />{" "}
                </Text>
            )}
            Building <Filename>{input}</Filename> →{" "}
            <Filename>{outDir}</Filename>
            {!!error && (
                <Text>
                    <Newline count={2} />
                    <ErrorFlag />
                    <Newline />
                    <Text>{error.message}</Text>
                </Text>
            )}
        </Text>
    );
};

export default Command;
