import type { MultiPrismCodeTab } from "@pluv-internal/react-code";
import { MultiPrismCode } from "@pluv-internal/react-code";
import { PageContainer } from "@pluv-internal/react-components";
import { codeBlock } from "common-tags";
import type { CSSProperties } from "react";
import { memo, useMemo, useState } from "react";
import tw from "twin.macro";
import type { HomeCodeDemoPositions, HomeCodeDemoSelections } from "./context";
import { HomeCodeDemoContext } from "./context";
import { HomeCodeDemoUserDemo } from "./HomeCodeDemoUserDemo";

const Root = tw(PageContainer)`
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
    h-[640px]
`;

const BoxesDemo = tw(HomeCodeDemoUserDemo)`
    grow
    basis-0
    min-w-0
    min-h-0
`;

const CodeDemo = tw(MultiPrismCode)`
    grow
    basis-0
    min-w-0
    min-h-0
    border
    border-solid
    border-indigo-500/40
    rounded-md
`;

export interface HomeCodeDemoProps {
    className?: string;
    style?: CSSProperties;
}

export const HomeCodeDemo = memo<HomeCodeDemoProps>((props) => {
    const { className, style } = props;

    const [initPositions, setInitPositions] = useState<HomeCodeDemoPositions>({
        first: { x: -48, y: 0 },
        second: { x: 48, y: 0 },
    });
    const [codePositions, setCodePositions] = useState<HomeCodeDemoPositions>({
        first: { x: -48, y: 0 },
        second: { x: 48, y: 0 },
    });
    const [selections, setSelections] = useState<HomeCodeDemoSelections>({
        jane: null,
        john: null,
    });

    const tabs = useMemo(
        (): readonly MultiPrismCodeTab<string>[] => [
            {
                code: codeBlock`
                    import {
                      usePluvMyPresence,
                      usePluvOthers,
                      usePluvStorage,
                    } from "client/pluv";
                    import type { FC } from "react";

                    export const Room: FC = () => {
                      // Get data and yjs shared type for mutations
                      const [boxes, sharedType] = usePluvStorage("boxes");
                      // { first: { x: ${codePositions.first.x}, y: ${codePositions.first.y} },
                      //   second: { x: ${codePositions.second.x}, y: ${codePositions.second.y} } }

                      // Observe and update your selection
                      const [selection, setPresence] = usePluvMyPresence((me) => me.selection);
                      setPresence({ selection: "first" });

                      // Get selections of other users
                      const selections = usePluvOthers((others) => {
                        return others.map((other) => other.presence.selection);
                      });

                      // return ...
                    };
                `,
                name: "Room.tsx",
            },
            {
                code: codeBlock`
                    import { y } from "@pluv/react";
                    import { PluvRoomProvider } from "client/pluv";
                    import type { FC, ReactNode } from "react";

                    interface ProviderProps {
                      children?: ReactNode;
                    }

                    export const Provider: FC<ProviderProps> = ({ children }) => {
                      return (
                        <PluvRoomProvider
                          initialPresence={{ selection: null }}
                          // Optionally override initial storage here
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
                name: "Provider.tsx",
            },
            {
                code: codeBlock`
                    import { createBundle, createClient, y } from "@pluv/react";
                    import type { io } from "server/pluv";
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
                      // This can be overwritten at the provider level
                      initialStorage: () => ({
                        boxes: y.object({
                          first: y.object({ x: 0, y: 0 }),
                          second: y.object({ x: 0, y: 0 }),
                        }),
                      }),
                    });
                `,
                name: "client/pluv.ts",
            },
            {
                code: codeBlock`
                    import { createIO } from "@pluv/io";
                    import { platformNode } from "@pluv/platform-node";
                    import { z } from "zod";

                    export const io = createIO({ platform: platformNode() });
                `,
                name: "server/pluv.ts",
            },
        ],
        [codePositions]
    );

    return (
        <HomeCodeDemoContext.Provider
            value={{
                codePositions,
                initPositions,
                selections,
                setCodePositions,
                setInitPositions,
                setSelections,
            }}
        >
            <Root className={className} style={style}>
                <ContentContainer>
                    <BoxesDemo />
                    <CodeDemo tabs={tabs} />
                </ContentContainer>
            </Root>
        </HomeCodeDemoContext.Provider>
    );
});

HomeCodeDemo.displayName = "HomeCodeDemo";
