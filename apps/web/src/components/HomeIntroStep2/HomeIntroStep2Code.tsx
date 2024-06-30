import { Card } from "@pluv-internal/react-components/either";
import { cn } from "@pluv-internal/utils";
import { codeBlock } from "common-tags";
import type { FC } from "react";
import { TypeScriptServerCodeBlock } from "../TypeScriptServerCodeBlock";

export interface HomeIntroStep2CodeProps {
    className?: string;
}

export const HomeIntroStep2Code: FC<HomeIntroStep2CodeProps> = ({ className }) => {
    return (
        <Card className={cn("flex flex-col items-stretch overflow-auto shadow-md", className)}>
            <TypeScriptServerCodeBlock
                className="grow"
                code={codeBlock`
                    import { createPluvHandler } from "@pluv/platform-node";
                    import express from "express";
                    import Http from "node:http";
                    import { ioServer } from "./server";

                    // ---cut---
                    const app = express();
                    const server = Http.createServer(app);
                    const Pluv = createPluvHandler({ io: ioServer, server });

                    Pluv.createWsServer();

                    app.use(Pluv.handler);
                    server.listen(3000);
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

                            export const ioServer = io.server({ router });

                            export type IOServer = typeof ioServer;
                        `,
                    },
                    shouldGetHoverInfo: () => false,
                }}
            />
        </Card>
    );
};
