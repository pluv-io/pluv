import { PrismCode } from "@pluv-internal/react-code";
import { useOrchestratedTypist, useTypist } from "@pluv-internal/react-hooks";
import { codeBlock } from "common-tags";
import { CSSProperties, FC, useMemo, useRef } from "react";

const INPUT_PARAMETER = "__INPUT_PARAMETER__";
const INPUT_PARAMETER_TEXT = " message: z.string() ";
const RESOLVER_PARAMETER = "__RESOLVER_PARAMETER__";
const RESOLVER_PARAMETER_TEXT = " message ";
const RESOLVER_OUTPUT = "__RESOLVER_OUTPUT__";
const RESOLVER_OUTPUT_TEXT = "MESSAGE_RECEIVED: { message }";

export interface HomeTypeSafetyDemoServerProps {
    className?: string;
    style?: CSSProperties;
}

export const HomeTypeSafetyDemoServer: FC<HomeTypeSafetyDemoServerProps> = ({
    className,
    style,
}) => {
    const template = useMemo(
        () => codeBlock`
            import { createIO } from "@pluv/io";
            import { platformCloudflare } from "@pluv/platform-cloudflare";
            import { z } from "zod";

            const io = createIO({
                platform: platformCloudflare(),
            })
                .event("EMIT_FIREWORK", {
                    input: z.object({ color: z.string() }),
                    resolver: ({ color }) => ({
                        FIREWORK_EMITTED: { color },
                    }),
                })
                .event("SEND_MESSAGE", {
                    input: z.object({${INPUT_PARAMETER}}),
                    resolver: ({${RESOLVER_PARAMETER}}) => ({${RESOLVER_OUTPUT}}),
                });
        `,
        []
    );

    const codeRef = useRef<HTMLPreElement>(null);

    const [
        { text: inputParam },
        { text: resolverParam },
        { text: resolverOutput },
    ] = useOrchestratedTypist(codeRef, {
        deleteSpeed: 0,
        sentences: [
            INPUT_PARAMETER_TEXT,
            RESOLVER_PARAMETER_TEXT,
            RESOLVER_OUTPUT_TEXT,
        ],
    });

    const code = useMemo(
        () =>
            template
                .replace(INPUT_PARAMETER, inputParam)
                .replace(RESOLVER_PARAMETER, resolverParam)
                .replace(
                    RESOLVER_OUTPUT,
                    resolverOutput
                        ? `\n            ${resolverOutput}\n        `
                        : ""
                ),
        [inputParam, resolverOutput, resolverParam, template]
    );

    return (
        <PrismCode
            ref={codeRef}
            className={className}
            style={style}
            language="tsx"
        >
            {code}
        </PrismCode>
    );
};
