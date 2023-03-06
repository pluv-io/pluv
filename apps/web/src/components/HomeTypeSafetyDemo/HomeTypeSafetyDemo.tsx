import { PrismCode } from "@pluv-internal/react-code";
import { codeBlock } from "common-tags";
import { CSSProperties, FC, useMemo } from "react";
import tw from "twin.macro";
import { HomeTypeSafetyDemoClient } from "./HomeTypeSafetyDemoClient";
import { HomeTypeSafetyDemoServer } from "./HomeTypeSafetyDemoServer";

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

    return (
        <Root className={className} style={style}>
            <ContentContainer>
                <CodeDemo as={HomeTypeSafetyDemoClient} />
                <CodeDemo as={HomeTypeSafetyDemoServer} />
            </ContentContainer>
        </Root>
    );
};
