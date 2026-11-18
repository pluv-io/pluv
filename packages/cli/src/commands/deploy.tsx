import { useEffect, useRef, useState } from "react";
import { Text, useInput } from "ink";
import Spinner from "ink-spinner";
import { option } from "pastel";
import { z } from "zod";
import { runDeploy } from "../command/deploy/runDeploy";
import { useConfig } from "../hooks/useConfig";

export const description = "Upload the built module and make it the active deployment";

export const options = z.object({
    org: z
        .string()
        .min(1)
        .optional()
        .describe(option({ description: "Organization slug." })),
    project: z
        .string()
        .min(1)
        .optional()
        .describe(option({ description: "Project slug." })),
});

export type DeployOptions = z.infer<typeof options>;

export default function Deploy({ options: flags }: { options: DeployOptions }) {
    const config = useConfig();
    const [question, setQuestion] = useState<string | null>(null);
    const [draft, setDraft] = useState("");
    const answer = useRef<((value: string) => void) | null>(null);

    useInput(
        (input, key) => {
            if (!question || !answer.current) return;

            if (key.return) {
                const submit = answer.current;

                answer.current = null;
                setQuestion(null);
                setDraft("");
                submit(draft);

                return;
            }

            if (key.backspace || key.delete) {
                setDraft((current) => current.slice(0, -1));

                return;
            }

            if (!key.ctrl && !key.meta && input) setDraft((current) => current + input);
        },
        { isActive: question !== null },
    );

    useEffect(() => {
        let stopped = false;
        const ask = (label: string): Promise<string> => {
            return new Promise((resolve) => {
                answer.current = (value) => {
                    if (!stopped) resolve(value);
                };
                setDraft("");
                setQuestion(label);
            });
        };

        void runDeploy({
            ask,
            config,
            cwd: process.cwd(),
            distDir: config.distDir,
            flags,
            isTTY: process.stdin.isTTY === true,
        }).then(
            (text) => {
                if (stopped) return;

                process.stderr.write(`${text}\n`);
                process.exit(0);
            },
            (caught: unknown) => {
                const text = caught instanceof Error ? caught.message : "Deploy failed.";

                process.stderr.write(`${text}\n`);
                process.exit(1);
            },
        );

        return () => {
            stopped = true;
        };
    }, [config, flags]);

    if (question) {
        return (
            <Text>
                {question}
                {draft}
            </Text>
        );
    }

    return (
        <Text>
            <Text color="#6366f1">
                <Spinner type="dots" />
            </Text>
            {" Deploying"}
        </Text>
    );
}
