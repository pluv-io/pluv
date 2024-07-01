import type { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import type { TransformerTwoslashOptions } from "@shikijs/twoslash";
import { oneLine } from "common-tags";
import type { FC } from "react";
import type { ShikiLanguage } from "../../utils/getShiki";
import { getShiki } from "../../utils/getShiki";

export type ServerCodeBlockProps = InferComponentProps<"div"> & {
    code: string;
    lang: ShikiLanguage;
    twoslashOptions?: TransformerTwoslashOptions["twoslashOptions"];
};

export const ServerCodeBlock: FC<ServerCodeBlockProps> = async ({
    className,
    lang,
    code,
    twoslashOptions,
    ...restProps
}) => {
    const getTwoSlash = async () => {
        if (!twoslashOptions) return null;

        const { rendererRich, transformerTwoslash } = await import("@shikijs/twoslash");

        return transformerTwoslash({
            renderer: rendererRich(),
            twoslashOptions: {
                ...twoslashOptions,
                compilerOptions: {
                    paths: {
                        "@pluv/crdt-yjs": ["../../packages/crdt-yjs/dist"],
                        "@pluv/io": ["../../packages/io/dist"],
                        "@pluv/platform-node": ["../../packages/platform-node/dist"],
                        "@pluv/react": ["../../packages/react/dist"],
                    },
                    ...twoslashOptions?.compilerOptions,
                },
            },
        });
    };

    const twoslash = await getTwoSlash();

    const highlighter = await getShiki();
    const html = highlighter.codeToHtml(code, {
        lang,
        themes: {
            light: "catppuccin-latte",
            dark: "catppuccin-macchiato",
        },
        transformers: [...(twoslash ? [twoslash] : [])],
    });

    return (
        <div
            {...restProps}
            className={cn(
                oneLine`
                    text-sm
                    md:text-base
                    [&>pre]:size-full
                    [&>pre]:p-3
                `,
                className,
            )}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
};
