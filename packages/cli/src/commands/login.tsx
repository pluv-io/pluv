import { useEffect, useState } from "react";
import { Box, Text } from "ink";
import Spinner from "ink-spinner";
import { runLogin } from "../command/login/runLogin";
import { useConfig } from "../hooks/useConfig";

export const description = "Log in and save a 24-hour session";

export default function Login() {
    const config = useConfig();
    const [url, setUrl] = useState<string | null>(null);

    useEffect(() => {
        let stopped = false;

        void runLogin(process.cwd(), config["~"], (opened) => {
            if (!stopped) setUrl(opened);
        }).then(
            (text) => {
                if (stopped) return;

                process.stderr.write(`${text}\n`);
                process.exit(0);
            },
            (caught: unknown) => {
                const text = caught instanceof Error ? caught.message : "Login failed.";

                process.stderr.write(`${text}\n`);
                process.exit(1);
            },
        );

        return () => {
            stopped = true;
        };
    }, [config]);

    return (
        <Box flexDirection="column">
            <Text>
                <Text color="#6366f1">
                    <Spinner type="dots" />
                </Text>
                {" Waiting for you to finish in the browser"}
            </Text>
            {url ? <Text dimColor>{`Open ${url} if the browser does not.`}</Text> : null}
        </Box>
    );
}
