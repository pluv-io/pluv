import { useOrchestratedTypist } from "@pluv-internal/react-hooks";
import ms from "ms";
import { CSSProperties, FC, useRef } from "react";
import tw from "twin.macro";
import { HomeTypeSafetyDemoContext } from "./context";
import { HomeTypeSafetyDemoClient } from "./HomeTypeSafetyDemoClient";
import { HomeTypeSafetyDemoServer } from "./HomeTypeSafetyDemoServer";

const CLIENT_INPUT_PARAMETER_TEXT = " data ";
const CLIENT_NEW_MESSAGE_TEXT = ", data\u200b.message\u200b";
const CLIENT_SEND_MESSAGE_INPUT_TEXT = " message ";
const SERVER_INPUT_PARAMETER_TEXT = " message: z.string() ";
const SERVER_RESOLVER_PARAMETER_TEXT = " message ";
const SERVER_RESOLVER_OUTPUT_TEXT = "MESSAGE_RECEIVED: { message },";

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
    h-[540px]
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
    const contentRef = useRef<HTMLDivElement>(null);

    const [typistStates] = useOrchestratedTypist(contentRef, {
        deleteSpeed: 0,
        repeat: false,
        sentences: [
            SERVER_INPUT_PARAMETER_TEXT,
            SERVER_RESOLVER_PARAMETER_TEXT,
            SERVER_RESOLVER_OUTPUT_TEXT,
            CLIENT_INPUT_PARAMETER_TEXT,
            CLIENT_NEW_MESSAGE_TEXT,
            CLIENT_SEND_MESSAGE_INPUT_TEXT,
        ],
        typingSpeed: ms("0.1s"),
    });

    return (
        <HomeTypeSafetyDemoContext.Provider value={typistStates}>
            <Root className={className} style={style}>
                <ContentContainer ref={contentRef}>
                    <CodeDemo as={HomeTypeSafetyDemoServer} />
                    <CodeDemo as={HomeTypeSafetyDemoClient} />
                </ContentContainer>
            </Root>
        </HomeTypeSafetyDemoContext.Provider>
    );
};
