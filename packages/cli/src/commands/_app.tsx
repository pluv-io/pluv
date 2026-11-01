import { useEffect, useState } from "react";
import type { AppProps } from "pastel";
import { ConfigProvider } from "../hooks/useConfig";
import type { PluvConfig } from "../schemas";
import { resolveDevConfig } from "../utils/loadConfig";
import type { DevOptions } from "./dev";

export default function App({ Component, commandProps }: AppProps) {
    const [config, setConfig] = useState<PluvConfig | null>(null);

    useEffect(() => {
        const options = commandProps.options as DevOptions;
        const entry = commandProps.args[0];

        void resolveDevConfig(process.cwd(), {
            entry: typeof entry === "string" ? entry : undefined,
            port: options.port,
        }).then(
            ({ config: loaded, warning }) => {
                if (warning) process.stderr.write(`${warning}\n`);

                setConfig(loaded);
            },
            (caught: unknown) => {
                const text =
                    caught instanceof Error ? caught.message : "Failed to load pluv config.";

                process.stderr.write(`${text}\n`);
                process.exit(1);
            },
        );
    }, [commandProps]);

    if (!config) return null;

    return (
        <ConfigProvider value={config}>
            <Component {...commandProps} />
        </ConfigProvider>
    );
}
