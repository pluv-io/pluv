import { useEffect, useState } from "react";
import { Box, Text, useApp } from "ink";
import Spinner from "ink-spinner";
import { runWhoami, type WhoamiAccount } from "../command/login/runWhoami";
import { Table } from "../components/Table";
import { useConfig } from "../hooks/useConfig";

export const description = "Retrieve your user information";

export default function Whoami() {
    const config = useConfig();
    const { exit, waitUntilRenderFlush } = useApp();
    const [account, setAccount] = useState<WhoamiAccount | null>(null);

    useEffect(() => {
        let stopped = false;

        void runWhoami(process.cwd(), config["~"]).then(
            (next) => {
                if (!stopped) setAccount(next);
            },
            (caught: unknown) => {
                const text =
                    caught instanceof Error ? caught.message : "Could not read the account.";

                process.stderr.write(`${text}\n`);
                process.exit(1);
            },
        );

        return () => {
            stopped = true;
        };
    }, [config]);

    useEffect(() => {
        if (!account) return;

        void waitUntilRenderFlush().then(() => {
            exit();
        });
    }, [account, exit, waitUntilRenderFlush]);

    if (!account) {
        return (
            <Text>
                <Text color="#6366f1">
                    <Spinner type="dots" />
                </Text>
                {" Retrieving user details"}
            </Text>
        );
    }

    return (
        <Box flexDirection="column">
            <Text>
                👋 You are logged in with an OAuth Token, associated with the email{" "}
                <Text bold color="blueBright">
                    {account.email}
                </Text>
                .
            </Text>
            <Table data={[{ "Account Name": account.name, "Account ID": account.id }]} />
        </Box>
    );
}
