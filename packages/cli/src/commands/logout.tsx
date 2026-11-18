import { useEffect } from "react";
import { Text } from "ink";
import Spinner from "ink-spinner";
import { runLogout } from "../command/login/runLogout";
import { useConfig } from "../hooks/useConfig";

export const description = "Delete the saved CLI session";

export default function Logout() {
    const config = useConfig();

    useEffect(() => {
        let stopped = false;

        void runLogout(process.cwd(), config["~"]).then(
            () => {
                if (stopped) return;

                process.stderr.write("Logged out\n");
                process.exit(0);
            },
            (caught: unknown) => {
                const text = caught instanceof Error ? caught.message : "Logout failed.";

                process.stderr.write(`${text}\n`);
                process.exit(1);
            },
        );

        return () => {
            stopped = true;
        };
    }, [config]);

    return (
        <Text>
            <Text color="#6366f1">
                <Spinner type="dots" />
            </Text>
            {" Logging out"}
        </Text>
    );
}
