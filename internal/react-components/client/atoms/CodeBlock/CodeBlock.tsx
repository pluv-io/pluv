import type { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import { forwardRef, useMemo } from "react";
import { codeToHtml } from "shiki/bundle/web";
import type { ShikiLanguage } from "../../../utils/getShiki";

export type CodeBlockProps = InferComponentProps<"div"> & {
    code: string;
    lang: ShikiLanguage;
};

export const CodeBlock = forwardRef<HTMLDivElement, CodeBlockProps>((props, ref) => {
    const { className, lang, code, ...restProps } = props;

    const html = useMemo(() => {
        return codeToHtml(code, {
            lang,
            themes: {
                light: "catppuccin-latte",
                dark: "catppuccin-macchiato",
            },
        });
    }, [code, lang]);

    return (
        <div
            {...restProps}
            className={cn(
                oneLine`
                    [&>pre]:size-full
                    [&>pre]:p-3
                `,
                className,
            )}
            dangerouslySetInnerHTML={html ? { __html: html } : undefined}
            ref={ref}
        />
    );
});

CodeBlock.displayName = "CodeBlock";
