import { Card } from "@pluv-internal/react-components/either";
import { cn } from "@pluv-internal/utils";
import { codeBlock } from "common-tags";
import type { FC } from "react";
import { ServerCodeBlock } from "../ServerCodeBlock";

export interface HomeIntroStep3CodeProps {
    className?: string;
}

export const HomeIntroStep3Code: FC<HomeIntroStep3CodeProps> = ({ className }) => {
    return (
        <Card className={cn("flex flex-col items-stretch overflow-auto shadow-md", className)}>
            <ServerCodeBlock
                className="grow"
                code={codeBlock`
                    import { yjs } from "@pluv/crdt-yjs";
                    import { createBundle, createClient } from "@pluv/react";
                    import { z } from "zod";
                    import type { IOServer } from "./server";

                    // ---cut---
                    const client = createClient<IOServer>({
                      wsEndpoint: ({ room }) => \`wss://pluv.io/api/pluv/room/\${room}\`,
                    });

                    const { createRoomBundle } = createBundle(client);

                    export const pluv = createRoomBundle({
                      presence: z.object({
                        selectionId: z.string().nullable(),
                      }),
                      initialStorage: yjs.doc(() => ({
                        tasks: yjs.array([
                          { id: "TASK-4753", status: "todo", priority: "medium" },
                          { id: "TASK-2676", status: "progress", priority: "high" },
                          { id: "TASK-5720", status: "progress", priority: "high" },
                        ]),
                      })),
                    });
                `}
                lang="tsx"
                twoslashOptions={{
                    extraFiles: {
                        "server.ts": codeBlock`
                            import { createIO } from "@pluv/io";
                            import { platformNode } from "@pluv/platform-node";
                            import { z } from "zod";

                            const io = createIO({ platform: platformNode() });

                            const router = io.router({
                                sendGreeting: io.procedure
                                    .input(z.object({ name: z.string() }))
                                    .broadcast(({ name }) => ({
                                        receiveGreeting: { greeting: \`Hi! I'm \${name}!\` },
                                    })),
                            });

                            const ioServer = io.server({ router });

                            export type IOServer = typeof ioServer;
                        `,
                    },
                    shouldGetHoverInfo: () => false,
                }}
            />
        </Card>
    );
};
