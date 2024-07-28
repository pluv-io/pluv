"use client";

import { CodeBlock as BaseCodeBlock } from "./CodeBlock";
import { CodeBlockProvider } from "./CodeBlockProvider";

export { CodeBlock as default } from "./CodeBlock";
export type { CodeBlockProps } from "./CodeBlock";
export { CodeBlockProvider } from "./CodeBlockProvider";

export const CodeBlock = Object.assign(BaseCodeBlock, {
    Provider: CodeBlockProvider,
});
