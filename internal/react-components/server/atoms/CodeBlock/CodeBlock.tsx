import { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import { Fragment, type FC } from "react";
import type { ShikiLanguage } from "../../../utils/getShiki";
import { getShiki } from "../../../utils/getShiki";

export type CodeBlockProps = InferComponentProps<"div"> & {
    code: string;
    lang: ShikiLanguage;
};

export const CodeBlock: FC<CodeBlockProps> = async ({ className, lang, code, ...restProps }) => {
    const highlighter = await getShiki();
    const html = highlighter.codeToHtml(code, {
        lang,
        themes: {
            light: "catppuccin-latte",
            dark: "catppuccin-macchiato",
        },
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
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
};