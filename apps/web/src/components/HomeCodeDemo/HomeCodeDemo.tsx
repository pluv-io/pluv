"use client";

import { Tabs } from "@pluv-internal/react-components/client";
import { Card } from "@pluv-internal/react-components/either";
import { useMediaQuery } from "@pluv-internal/react-hooks";
import { cn } from "@pluv-internal/utils";
import { codeBlock, oneLine } from "common-tags";
import type { CSSProperties } from "react";
import { memo, useEffect, useMemo, useState } from "react";
import { CodeBlock } from "../CodeBlock";
import { HomeCodeDemoUserDemo } from "./HomeCodeDemoUserDemo";
import { BOX_SIZE, MOBILE_BOX_SIZE } from "./constants";
import type { HomeCodeDemoPositions, HomeCodeDemoSelections } from "./context";
import { HomeCodeDemoContext } from "./context";

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
        "User 1": null,
        "User 2": null,
    });

    const codeRoomTsx = useMemo(() => {
        return codeBlock`
          import {
            useMyPresence,
            useOthers,
            useStorage,
          } from "client/pluv";
          import type { FC } from "react";

          export const Room: FC = () => {
            // Get data and yjs shared type for mutations
            const [boxes, sharedType] = useStorage("boxes");
            // { first: { x: ${codePositions.first.x}, y: ${codePositions.first.y} },
            //   second: { x: ${codePositions.second.x}, y: ${codePositions.second.y} } }

            // Observe and update your selection
            const [selection, setPresence] = useMyPresence((me) => me.selection);
            setPresence({ selection: "first" });

            // Get selections of other users
            const selections = useOthers((others) => {
              return others.map((other) => other.presence.selection);
            });

            // return ...
          };
        `;
    }, [codePositions]);

    const codeProviderTsx = useMemo(() => {
        return codeBlock`
        import { yjs } from "@pluv/crdt-yjs";
        import { PluvRoomProvider } from "client/pluv";
        import type { FC, ReactNode } from "react";

        export interface ProviderProps {
          children?: ReactNode;
        }

        export const Provider: FC<ProviderProps> = ({ children }) => {
          return (
            <PluvRoomProvider
              initialPresence={{ selection: null }}
              // Optionally override initial storage here
              initialStorage={() => ({
                boxes: yjs.object({
                  first: yjs.object({ x: -48, y: 0 }),
                  second: yjs.object({ x: 48, y: 0 }),
                }),
              })}
              room="demo-room"
            >
              {children}
            </PluvRoomProvider>
          );
        };
      `;
    }, []);

    const codeClientPluvTs = useMemo(() => {
        return codeBlock`
          import { yjs } from "@pluv/crdt-yjs";
          import { createBundle, createClient } from "@pluv/react";
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
            useClient,
          } = createBundle(client);

          export const {
            // components
            MockedRoomProvider,
            PluvRoomProvider,

            // utils
            event,

            // hooks
            useBroadcast,
            useCanRedo,
            useCanUndo,
            useConnection,
            useDoc,
            useEvent,
            useMyPresence,
            useMyself,
            useOther,
            useOthers,
            useRedo,
            useRoom,
            useStorage,
            useTransact,
            useUndo,
          } = createRoomBundle({
            presence: z.object({
              selection: z.nullable(z.string()),
            }),
            // This can be overwritten at the provider level
            initialStorage: yjs.doc(() => ({
              boxes: yjs.object({
                first: yjs.object({ x: 0, y: 0 }),
                second: yjs.object({ x: 0, y: 0 }),
              }),
            })),
          });
        `;
    }, []);

    const codeServerPluvTs = useMemo(() => {
        return codeBlock`
          import { yjs } from "@pluv/crdt-yjs";
          import { createIO } from "@pluv/io";
          import { platformNode } from "@pluv/platform-node";
          import { z } from "zod";

          // Create @pluv/io websocket manager for Node.js
          export const io = createIO({
            crdt: yjs,
            platform: platformNode(),
          });
        `;
    }, []);

    const isDesktop = useMediaQuery(`(min-width: 768px)`);

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
            <div
                className={cn(
                    oneLine`
                        flex
                        h-[980px]
                        w-full
                        flex-col
                        items-stretch
                        justify-center
                        gap-[16px]
                        md:h-[640px]
                        md:flex-row
                        md:gap-[32px]
                    `,
                    className,
                )}
                style={style}
            >
                <HomeCodeDemoUserDemo
                    className={oneLine`
                        min-h-[240px]
                        min-w-0
                        basis-0
                        sm:min-h-[280px]
                        md:min-h-0
                        md:grow-[2]
                  `}
                />
                <Tabs
                    className="flex min-h-0 min-w-0 grow-[3] basis-0 flex-col items-stretch gap-2"
                    defaultValue="Room.tsx"
                >
                    <Tabs.List className="grid w-full grid-cols-4">
                        <Tabs.Trigger value="Room.tsx">Room.tsx</Tabs.Trigger>
                        <Tabs.Trigger value="Provider.tsx">Provider.tsx</Tabs.Trigger>
                        <Tabs.Trigger value="client/pluv.ts">client/pluv.ts</Tabs.Trigger>
                        <Tabs.Trigger value="server/pluv.ts">server/pluv.ts</Tabs.Trigger>
                    </Tabs.List>
                    <Card className="flex min-h-0 grow basis-0 flex-col items-stretch overflow-y-auto shadow-md">
                        <Tabs.Content asChild value="Room.tsx">
                            <CodeBlock className="mt-0 flex grow flex-col [&_pre]:grow" code={codeRoomTsx} lang="tsx" />
                        </Tabs.Content>
                        <Tabs.Content asChild value="Provider.tsx">
                            <CodeBlock
                                className="mt-0 flex grow flex-col [&_pre]:grow"
                                code={codeProviderTsx}
                                lang="tsx"
                            />
                        </Tabs.Content>
                        <Tabs.Content asChild value="client/pluv.ts">
                            <CodeBlock
                                className="mt-0 flex grow flex-col [&_pre]:grow"
                                code={codeClientPluvTs}
                                lang="tsx"
                            />
                        </Tabs.Content>
                        <Tabs.Content asChild value="server/pluv.ts">
                            <CodeBlock
                                className="mt-0 flex grow flex-col [&_pre]:grow"
                                code={codeServerPluvTs}
                                lang="tsx"
                            />
                        </Tabs.Content>
                    </Card>
                </Tabs>
                {/* <MultiPrismCode
                        className={oneLine`
                            min-h-0
                            min-w-0
                            grow
                            basis-0
                            rounded-md
                            border
                            border-solid
                            border-indigo-500/40
                        `}
                        tabs={tabs}
                    /> */}
            </div>
        </HomeCodeDemoContext.Provider>
    );
});

HomeCodeDemo.displayName = "HomeCodeDemo";
