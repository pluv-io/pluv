import type { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import type { FC } from "react";
import { getEdgeShiki } from "../../utils/getEdgeShiki";
import type { ShikiLanguage } from "../../utils/getShiki";

export type ServerCodeBlockProps = InferComponentProps<"div"> & {
    code: string;
    lang: ShikiLanguage;
};

export const ServerCodeBlock: FC<ServerCodeBlockProps> = async ({ className, lang, code, ...restProps }) => {
    const highlighter = await getEdgeShiki();
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
