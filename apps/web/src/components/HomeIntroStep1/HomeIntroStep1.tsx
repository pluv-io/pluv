import { Anchor, Code, PageContainer } from "@pluv-internal/react-components/either";
import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import type { FC } from "react";
import { HomeIntroCodeStep1 } from "../HomeIntroCodeStep1";

export interface HomeIntroStep1Props {
    className?: string;
}

export const HomeIntroStep1: FC<HomeIntroStep1Props> = ({ className }) => {
    return (
        <PageContainer
            className={cn(
                oneLine`
                    mx-auto
                    flex
                    w-full
                    max-w-screen-2xl
                    flex-col
                    justify-center
                    gap-12
                    lg:flex-row-reverse
                    lg:items-start
                    lg:justify-end
                    lg:gap-16
                `,
                className,
            )}
        >
            <div className="flex min-w-0 flex-1 flex-col items-start">
                <div className="flex items-center gap-3">
                    <span
                        className={oneLine`
                            flex
                            size-6
                            shrink-0
                            items-center
                            justify-center
                            rounded-full
                            bg-primary
                            text-sm
                            font-bold
                            text-primary-foreground
                        `}
                    >
                        1
                    </span>
                    <h3 className="text-xl font-semibold md:text-2xl">Create your PluvIO server</h3>
                </div>
                <p className="mt-3 text-sm md:text-base">
                    To get started with pluv.io, you will first need to create a <Code>PluvIO</Code> server that can
                    start registering new websocket connections.
                    <br />
                    <br />
                    On the server, you can define any number of event procedures that your frontend can broadcast to
                    other connections in the same realtime room.
                    <br />
                    <br />
                    In these event procedures, you can optionally define{" "}
                    <Anchor href="https://github.com/colinhacks/zod" target="_blank" rel="noreferrer noopener">
                        Zod
                    </Anchor>{" "}
                    schema validators to ensure that the inputs are defined in the same way our backend expects when
                    they are received.
                    <br />
                    <br />
                    Lastly, define a type export of the <Code>IOServer</Code> for our frontend to use.
                </p>
            </div>
            <HomeIntroCodeStep1 className="min-w-0 flex-1" />
        </PageContainer>
    );
};
