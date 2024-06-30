import type { HighlighterGeneric } from "shiki/core";

export type ShikiLanguage = "bash" | "javascript" | "jsx" | "tsx" | "typescript";
export type ShikiTheme = "catppuccin-latte" | "catppuccin-macchiato";

export const getShiki = async () => {
    const { getHighlighterCore } = await import("shiki/core");
    const getWasm = await import("shiki/wasm");

    const highlighter = await getHighlighterCore({
        themes: [import("shiki/themes/catppuccin-latte.mjs"), import("shiki/themes/catppuccin-macchiato.mjs")],
        langs: [
            import("shiki/langs/bash.mjs"),
            import("shiki/langs/javascript.mjs"),
            import("shiki/langs/jsx.mjs"),
            import("shiki/langs/tsx.mjs"),
            import("shiki/langs/typescript.mjs"),
        ],
        loadWasm: getWasm,
    });

    return highlighter as HighlighterGeneric<ShikiLanguage, ShikiTheme>;
};
