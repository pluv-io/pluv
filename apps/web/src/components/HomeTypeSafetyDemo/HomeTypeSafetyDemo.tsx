import { PrismCode } from "@pluv-internal/react-code";
import { useOrchestratedTypist } from "@pluv-internal/react-hooks";
import { codeBlock } from "common-tags";
import ms from "ms";
import { CSSProperties, FC, useMemo, useRef } from "react";
import tw from "twin.macro";
import { HomeTypeSafetyDemoContext } from "./context";
import { HomeTypeSafetyDemoClient } from "./HomeTypeSafetyDemoClient";
import { HomeTypeSafetyDemoServer } from "./HomeTypeSafetyDemoServer";

const INPUT_PARAMETER_TEXT = " message: z.string() ";
const RESOLVER_PARAMETER_TEXT = " message ";
const RESOLVER_OUTPUT_TEXT = "MESSAGE_RECEIVED: { message }";

const Root = tw.div`
    flex
    flex-col
    items-center
`;

const ContentContainer = tw.div`
    flex
    flex-row
    items-stretch
    justify-center
    gap-[32px]
    max-w-[1080px]
    w-full
    h-[480px]
`;

const CodeDemo = tw.div`
    grow
    basis-0
    min-w-0
    min-h-0
    border
    border-solid
    border-indigo-500/40
    rounded-md
`;

export interface HomeTypeSafetyDemoProps {
    className?: string;
    style?: CSSProperties;
}

export const HomeTypeSafetyDemo: FC<HomeTypeSafetyDemoProps> = ({
    className,
    style,
}) => {
    const serverCode = useMemo(
        () => codeBlock`
            import { createIO } from "@pluv/io";
            import { platformCloudflare } from "@pluv/platform-cloudflare";
            import { z } from "zod";

            const io = createIO({
                platform: platformCloudflare(),
            })
                .event("SEND_MESSAGE", {
                    input: z.object({ message: z.string() }),
                    resolver: ({ message }) => ({
                        MESSAGE_RECEIVED: { message },
                    }),
                })
                .event("EMIT_FIREWORK", {
                    input: z.object({ color: z.string() }),
                    resolver: ({ color }) => ({
                        FIREWORK_EMITTED: { color },
                    }),
                });
        `,
        []
    );

    const contentRef = useRef<HTMLDivElement>(null);

    const [typistStates] = useOrchestratedTypist(contentRef, {
        deleteSpeed: 0,
        repeat: false,
        sentences: [
            INPUT_PARAMETER_TEXT,
            RESOLVER_PARAMETER_TEXT,
            RESOLVER_OUTPUT_TEXT,
        ],
        typingSpeed: ms("0.1s"),
    });

    return (
        <HomeTypeSafetyDemoContext.Provider value={typistStates}>
            <Root className={className} style={style}>
                <ContentContainer ref={contentRef}>
                    <CodeDemo as={HomeTypeSafetyDemoClient} />
                    <CodeDemo as={HomeTypeSafetyDemoServer} />
                </ContentContainer>
            </Root>
        </HomeTypeSafetyDemoContext.Provider>
    );
};
