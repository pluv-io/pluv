import { Card } from "@pluv-internal/react-components/either";
import { cn } from "@pluv-internal/utils";
import { codeBlock } from "common-tags";
import type { FC } from "react";
import { TypeScriptServerCodeBlock } from "../TypeScriptServerCodeBlock";

export interface HomeIntroStep1CodeProps {
    className?: string;
}

export const HomeIntroStep1Code: FC<HomeIntroStep1CodeProps> = ({ className }) => {
    return (
        <Card className={cn("flex flex-col items-stretch overflow-auto shadow-md", className)}>
            <TypeScriptServerCodeBlock
                className="grow"
                code={codeBlock`
                    import { createIO } from "@pluv/io";
                    import { createPluvHandler, platformNode } from "@pluv/platform-node";
                    import { z } from "zod";

                    // ---cut---
                    const io = createIO({ platform: platformNode() });

                    const router = io.router({
                      sendGreeting: io.procedure
                        .input(z.object({ name: z.string() }))
                        .broadcast(({ name }) => ({
                          //          ^?


                          receiveGreeting: { greeting: \`Hi! I'm \${name}!\` },
                        })),
                    });

                    export const ioServer = io.server({ router });

                    export type IOServer = typeof ioServer;
                `}
                lang="tsx"
                twoslashOptions={{
                    shouldGetHoverInfo: (identifier) => {
                        return identifier === "name";
                    },
                }}
            />
        </Card>
    );
};
