import type { MultiPrismCodeTab } from "@pluv-internal/react-code";
import { MultiPrismCode } from "@pluv-internal/react-code";
import { useMediaQuery } from "@pluv-internal/react-hooks";
import { codeBlock } from "common-tags";
import { CSSProperties, useEffect } from "react";
import { memo, useMemo, useState } from "react";
import tw, { theme } from "twin.macro";
import { BOX_SIZE, MOBILE_BOX_SIZE } from "./constants";
import type { HomeCodeDemoPositions, HomeCodeDemoSelections } from "./context";
import { HomeCodeDemoContext } from "./context";
import { HomeCodeDemoUserDemo } from "./HomeCodeDemoUserDemo";

const Root = tw.div`
    flex
    flex-col
    items-center
`;

const ContentContainer = tw.div`
    flex
    flex-col
    items-stretch
    justify-center
    gap-[16px]
    max-w-[1080px]
    w-full
    h-[980px]
    md:flex-row
    md:h-[640px]
    md:gap-[32px]
`;

const BoxesDemo = tw(HomeCodeDemoUserDemo)`
    basis-0
    min-w-0
    min-h-[240px]
    sm:min-h-[280px]
    md:min-h-0
    md:grow
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
        first: { x: -56, y: 0 },
        second: { x: 56, y: 0 },
    });
    const [codePositions, setCodePositions] = useState<HomeCodeDemoPositions>({
        first: { x: -56, y: 0 },
        second: { x: 56, y: 0 },
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

                    export interface ProviderProps {
                      children?: ReactNode;
                    }

                    const initialPresence = { selection: null };

                    const initialStorage = () => ({
                      boxes: y.object({
                        first: y.object({ x: -48, y: 0 }),
                        second: y.object({ x: 48, y: 0 }),
                      }),
                    });

                    export const Provider: FC<ProviderProps> = ({ children }) => {
                      return (
                        <PluvRoomProvider
                          initialPresence={initialPresence}
                          // Optionally override initial storage here
                          initialStorage={initialStorage}
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

                    // Create @pluv/io websocket manager for Node.js
                    export const io = createIO({ platform: platformNode() });
                `,
                name: "server/pluv.ts",
            },
        ],
        [codePositions]
    );

    const isDesktop = useMediaQuery(`(min-width: ${theme`screens.md`})`);

    const boxSize = isDesktop ? BOX_SIZE : MOBILE_BOX_SIZE;

    useEffect(() => {
        setInitPositions({
            first: { x: (-2 * boxSize) / 3, y: 0 },
            second: { x: (2 * boxSize) / 3, y: 0 },
        });

        setCodePositions({
            first: { x: (-2 * boxSize) / 3, y: 0 },
            second: { x: (2 * boxSize) / 3, y: 0 },
        });
    }, [boxSize]);

    return (
        <HomeCodeDemoContext.Provider
            value={{
                boxSize,
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
