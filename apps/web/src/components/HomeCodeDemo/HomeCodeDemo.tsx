import { MultiPrismCode, MultiPrismCodeTab } from "@pluv-internal/react-code";
import { PageContainer } from "@pluv-internal/react-components";
import { codeBlock } from "common-tags";
import { CSSProperties, memo, useMemo } from "react";
import tw from "twin.macro";

const Root = tw(PageContainer)`
    flex
    flex-col
    items-center
    gap-[32px]
`;

const ContentContainer = tw.div`
    flex
    flex-row
    items-stretch
    justify-center
    max-w-[980px]
    w-full
`;

const CodeDemo = tw(MultiPrismCode)`
    grow
    min-w-0
`;

export interface HomeCodeDemoProps {
    className?: string;
    style?: CSSProperties;
}

export const HomeCodeDemo = memo<HomeCodeDemoProps>((props) => {
    const { className, style } = props;

    const tabs = useMemo(
        (): readonly MultiPrismCodeTab<string>[] => [
            {
                code: codeBlock`
                    import { createBundle, createClient, y } from "@pluv/react";
                    import type { io } from "server/pluv-io";
                    import { z } from "zod";

                    const client = createClient<typeof io>({
                        wsEndpoint: (room) => \`ws://pluv.io/api/room/\${room}\`
                    });

                    export const {
                        // factories
                        createRoomBundle,

                        // components
                        PluvProvider,

                        // hooks
                        usePluvClient,
                    } = createBundle(client);

                    export const {
                        // components
                        MockedRoomProvider,
                        PluvRoomProvider,
                    
                        // hooks
                        usePluvBroadcast,
                        usePluvConnection,
                        usePluvEvent,
                        usePluvMyPresence,
                        usePluvMyself,
                        usePluvOther,
                        usePluvOthers,
                        usePluvRoom,
                        usePluvStorage,
                    } = createRoomBundle({
                        presence: z.object({
                            selection: z.nullable(z.string()),
                        }),
                        initialStorage: () => ({
                            boxes: y.object({
                                first: y.object({ x: 0, y: 0 }),
                                second: y.object({ x: 0, y: 0 }),
                            }),
                        }),
                    });
                `,
                name: "client/pluv-io.ts",
            },
            {
                code: codeBlock`
                    import { PluvRoomProvider } from "client/pluv-io";

                    export const RoomProvider = ({ children }) => {
                        return (
                            <PluvRoomProvider
                                initialPresence={{ selection: null }}
                                initialStorage={() => ({
                                    boxes: y.object({
                                        first: y.object({ x: -48, y: 0 }),
                                        second: y.object({ x: 48, y: 0 }),
                                    }),
                                })}
                                room="demo-room"
                            >
                                {children}
                            </PluvRoomProvider>
                        );
                    };
                `,
                name: "client/RoomProvider.tsx",
            },
        ],
        []
    );

    return (
        <Root className={className} style={style}>
            <ContentContainer>
                <CodeDemo tabs={tabs} />
            </ContentContainer>
        </Root>
    );
});

HomeCodeDemo.displayName = "HomeCodeDemo";
