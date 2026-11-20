import { readSync } from "node:fs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useKeyboard } from "@opentui/react";
import { useState, type ReactNode } from "react";
import type { CliRenderer, ScreenMode } from "@opentui/core";
import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { z } from "zod";

let renderer: CliRenderer | undefined;
let closing = false;
let rawModeWrapped = false;

const ZodAgain = z.object({
    code: z.enum(["EAGAIN", "EWOULDBLOCK"]),
});

/** OpenTUI turns echo back on before it discards unread input. Read that input first. */
const discardPendingInput = (fd: number): void => {
    const buffer = Buffer.alloc(1024);

    try {
        for (;;) {
            if (readSync(fd, buffer) <= 0) break;
        }
    } catch (error) {
        if (!ZodAgain.safeParse(error).success) throw error;
    }
};

const quietRawMode = (): void => {
    if (rawModeWrapped) return;

    const stdin = process.stdin;

    if (!stdin.isTTY || !stdin.setRawMode) return;

    rawModeWrapped = true;
    const setRawMode = stdin.setRawMode.bind(stdin);

    stdin.setRawMode = (mode: boolean) => {
        if (!mode && stdin.isRaw) discardPendingInput(stdin.fd);

        return setRawMode(mode);
    };
};

/** Tear down the terminal, print the result, and stop. */
export const closeApp = async (text: string, code: number): Promise<void> => {
    if (closing) return;

    closing = true;
    const current = renderer;

    renderer = undefined;

    if (current) {
        current.destroy();
        await current.closed;
    }

    if (text.length > 0) process.stderr.write(text.endsWith("\n") ? text : `${text}\n`);

    process.exit(code);
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
        if (key.ctrl && key.name === "c") void closeApp("", 130);
    });

    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

/** Draw one screen. The screen calls `closeApp` when it finishes. */
export const openScreen = async (screen: ReactNode, screenMode: ScreenMode): Promise<void> => {
    quietRawMode();
    renderer = await createCliRenderer({
        consoleMode: "disabled",
        exitOnCtrlC: false,
        footerHeight: screenMode === "split-footer" ? 3 : undefined,
        screenMode,
        targetFps: 30,
        useMouse: false,
    });
    createRoot(renderer).render(<Shell>{screen}</Shell>);
};
