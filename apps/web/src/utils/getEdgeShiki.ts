import type { HighlighterGeneric } from "shiki/core";
import { getHighlighterCore, loadWasm } from "shiki/core";
// @ts-ignore
import wasmModule from "shiki/onig.wasm?module";

export type ShikiLanguage = "bash" | "tsx" | "typescript";
export type ShikiTheme = "catppuccin-latte" | "catppuccin-macchiato";

export const getEdgeShiki = async () => {
    // @ts-ignore
    await loadWasm(wasmModule);

    const highlighter = await getHighlighterCore({
        themes: [import("shiki/themes/catppuccin-latte.mjs"), import("shiki/themes/catppuccin-macchiato.mjs")],
        langs: [import("shiki/langs/bash.mjs"), import("shiki/langs/tsx.mjs")],
    });

    return highlighter as HighlighterGeneric<ShikiLanguage, ShikiTheme>;
};
