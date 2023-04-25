import { PrismCode } from "@pluv-internal/react-code";
import { codeBlock } from "common-tags";
import { CSSProperties, memo, useContext, useMemo } from "react";
import { HomeTypeSafetyDemoContext } from "./context";
import { HomeTypeSafetyDemoServerToken } from "./HomeTypeSafetyDemoServerToken";

const INPUT_PARAMETER = "__INPUT_PARAMETER__";
const RESOLVER_PARAMETER = "__RESOLVER_PARAMETER__";
const RESOLVER_OUTPUT = "__RESOLVER_OUTPUT__";

export interface HomeTypeSafetyDemoServerProps {
    className?: string;
    style?: CSSProperties;
}

export const HomeTypeSafetyDemoServer = memo<HomeTypeSafetyDemoServerProps>(
    ({ className, style }) => {
        const template = useMemo(
            () => codeBlock`
                // server/pluv.ts

                import { createIO } from "@pluv/io";
                import { platformCloudflare } from "@pluv/platform-cloudflare";
                import { z } from "zod";

                // Create your PluvIO server
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
                    // Set input validator and type
                    input: z.object({${INPUT_PARAMETER}}),
                    // Set output value and type
                    resolver: ({${RESOLVER_PARAMETER}}) => ({${RESOLVER_OUTPUT}}),
                });
            `,
            []
        );

        const [
            { text: inputParam },
            { text: resolverParam },
            { text: resolverOutput },
        ] = useContext(HomeTypeSafetyDemoContext);

        const code = useMemo(() => {
            return template
                .replace(INPUT_PARAMETER, inputParam)
                .replace(RESOLVER_PARAMETER, resolverParam)
                .replace(
                    RESOLVER_OUTPUT,
                    resolverOutput ? `\n      ${resolverOutput}\n    ` : ""
                );
        }, [inputParam, resolverOutput, resolverParam, template]);

        return (
            <PrismCode
                className={className}
                style={style}
                language="tsx"
                tokenRenderer={HomeTypeSafetyDemoServerToken}
            >
                {code}
            </PrismCode>
        );
    }
);

HomeTypeSafetyDemoServer.displayName = "HomeTypeSafetyDemoServer";
