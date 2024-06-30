import type { HighlighterGeneric } from "shiki/core";
import { getHighlighterCore } from "shiki/core";

export type ShikiLanguage = "bash" | "tsx" | "typescript";
export type ShikiTheme = "catppuccin-latte" | "catppuccin-macchiato";

export const getShiki = async () => {
    const getWasm = await import("shiki/wasm");

    const highlighter = await getHighlighterCore({
        langAlias: {
            bash: "bash",
            javascript: "tsx",
            js: "tsx",
            ts: "tsx",
            typescript: "tsx",
        },
        themes: [import("shiki/themes/catppuccin-latte.mjs"), import("shiki/themes/catppuccin-macchiato.mjs")],
        langs: [import("shiki/langs/bash.mjs"), import("shiki/langs/tsx.mjs")],
        loadWasm: getWasm,
    });

    return highlighter as HighlighterGeneric<ShikiLanguage, ShikiTheme>;
};
