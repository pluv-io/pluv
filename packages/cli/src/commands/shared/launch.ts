import type { ReactNode } from "react";
import type { ScreenMode } from "@opentui/core";
import { resolveDevConfig } from "../../config/loadConfig";
import { cacheServiceUrls } from "../../config/serviceUrls";
import type { PluvConfig } from "../../schemas";
import { openScreen } from "../../terminal";

/** Load config, then draw a screen or run without a terminal. */
export const launch = async (params: {
    entry?: string;
    /** Skip the `pluv build` typecheck for this run. */
    noTypecheck?: boolean;
    port?: number;
    mode: ScreenMode;
    screen: (props: { config: PluvConfig; warning: string | null }) => ReactNode;
    headless: (config: PluvConfig) => Promise<void>;
}): Promise<void> => {
    const resolved = await resolveDevConfig(process.cwd(), {
        entry: params.entry,
        noTypecheck: params.noTypecheck,
        port: params.port,
    });

    cacheServiceUrls(resolved.config["~"]);
    const interactive = process.stdin.isTTY && process.stdout.isTTY;

    if (!interactive) {
        if (resolved.warning) process.stderr.write(`${resolved.warning}\n`);

        await params.headless(resolved.config);
        return;
    }

    await openScreen(
        params.screen({ config: resolved.config, warning: resolved.warning }),
        params.mode,
    );
    await new Promise<void>(() => {});
};
