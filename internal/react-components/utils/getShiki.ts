import type { HighlighterGeneric } from "shiki/core";
import { getHighlighterCore } from "shiki/core";

export type ShikiLanguage = "bash" | "javascript" | "jsx" | "tsx" | "typescript";
export type ShikiTheme = "catppuccin-latte" | "catppuccin-macchiato";

export const getShiki = async () => {
    // @ts-ignore
    const wasmModule = await import("shiki/dist/onig.wasm?module");

    await WebAssembly.instantiate(wasmModule);

    const highlighter = await getHighlighterCore({
        themes: [import("shiki/themes/catppuccin-latte.mjs"), import("shiki/themes/catppuccin-macchiato.mjs")],
        langs: [import("shiki/langs/bash.mjs"), import("shiki/langs/tsx.mjs"), import("shiki/langs/typescript.mjs")],
    });

    return highlighter as HighlighterGeneric<ShikiLanguage, ShikiTheme>;
};
