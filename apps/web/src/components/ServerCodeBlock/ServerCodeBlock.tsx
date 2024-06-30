import type { ShikiLanguage } from "@pluv-internal/react-components/utils";
import { getShiki } from "@pluv-internal/react-components/utils";
import type { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import type { TransformerTwoslashOptions } from "@shikijs/twoslash";
import { rendererRich, transformerTwoslash } from "@shikijs/twoslash";
import { oneLine } from "common-tags";
import type { FC } from "react";

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
    const highlighter = await getShiki();
    const html = highlighter.codeToHtml(code, {
        lang,
        themes: {
            light: "catppuccin-latte",
            dark: "catppuccin-macchiato",
        },
        transformers: [
            transformerTwoslash({
                renderer: rendererRich(),
                twoslashOptions: {
                    ...twoslashOptions,
                    compilerOptions: {
                        ...(process.env.VERCEL_ENV === "production"
                            ? {}
                            : {
                                  paths: {
                                      "@pluv/crdt-yjs": ["../../packages/crdt-yjs/dist"],
                                      "@pluv/io": ["../../packages/io/dist"],
                                      "@pluv/platform-node": ["../../packages/platform-node/dist"],
                                      "@pluv/react": ["../../packages/react/dist"],
                                  },
                              }),
                        ...twoslashOptions?.compilerOptions,
                    },
                },
            }),
        ],
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
