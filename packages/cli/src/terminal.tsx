import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useKeyboard } from "@opentui/react";
import { useState, type ReactNode } from "react";
import type { CliRenderer, ScreenMode } from "@opentui/core";
import { createCliRenderer } from "@opentui/core";
import { createRoot, type Root } from "@opentui/react";

let renderer: CliRenderer | undefined;
let root: Root | undefined;
let closing = false;

/** OpenTUI teardown per https://opentui.com/docs/core-concepts/lifecycle/ */
export const closeRenderer = async (): Promise<void> => {
    if (closing) return;

    closing = true;
    const currentRenderer = renderer;
    const currentRoot = root;

    renderer = undefined;
    root = undefined;

    if (currentRenderer) await currentRenderer.idle();

    if (currentRoot) currentRoot.unmount();

    if (!currentRenderer) return;

    currentRenderer.destroy();

    try {
        await currentRenderer.closed;
    } catch {
        // Restoration may finish before native close times out.
    }
};

const Shell = ({ children }: { children: ReactNode }) => {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        refetchOnWindowFocus: false,
                        retry: false,
                    },
                },
            }),
    );

    useKeyboard((key) => {
        if (key.ctrl && key.name === "c") {
            void closeRenderer().then(() => {
                process.exit(130);
            });
        }
    });

    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

/** Draw one screen. Screens call `done()` when they finish. */
export const openScreen = async (screen: ReactNode, screenMode: ScreenMode): Promise<void> => {
    renderer = await createCliRenderer({
        consoleMode: "disabled",
        exitOnCtrlC: false,
        footerHeight: screenMode === "split-footer" ? 3 : undefined,
        screenMode,
        targetFps: 30,
        useMouse: false,
    });
    const nextRoot = createRoot(renderer);

    root = nextRoot;
    nextRoot.render(<Shell>{screen}</Shell>);
};