import { useAsync, useMountEffect } from "@pluv-internal/react-hooks";
import type { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import { useMemo, type FC } from "react";
import type { ShikiLanguage } from "../../../utils/getShiki";
import { getShiki } from "../../../utils/getShiki";

export type CodeBlockProps = InferComponentProps<"div"> & {
    code: string;
    lang: ShikiLanguage;
};

export const CodeBlock: FC<CodeBlockProps> = ({ className, lang, code, ...restProps }) => {
    const [{ result: highlighter }, { execute }] = useAsync(async () => await getShiki(), null);

    const html = useMemo(() => {
        if (!highlighter) return null;

        return highlighter.codeToHtml(code, {
            lang,
            themes: {
                light: "catppuccin-latte",
                dark: "catppuccin-macchiato",
            },
        });
    }, [code, highlighter, lang]);

    useMountEffect(() => {
        execute();
    });

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
        />
    );
};