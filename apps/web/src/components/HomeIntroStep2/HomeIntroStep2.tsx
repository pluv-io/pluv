import { Anchor, Code, PageContainer } from "@pluv-internal/react-components/either";
import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import type { FC } from "react";
import { HomeIntroCodeStep2 } from "../HomeIntroCodeStep2";

export interface HomeIntroStep2Props {
    className?: string;
}

export const HomeIntroStep2: FC<HomeIntroStep2Props> = ({ className }) => {
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
                        2
                    </span>
                    <h3 className="text-xl font-semibold md:text-2xl">Prepare your frontend bundle</h3>
                </div>
                <p className="mt-3 text-sm md:text-base">
                    Next, we will prepare our frontend bundle by using a type import of our <Code>IOServer</Code>. The
                    room bundle will provide a <Code>PluvRoomProvider</Code> to wrap your page with. Once you do, your
                    app is now multiplayer with pluv.io!
                    <br />
                    <br />
                    You can optionally define a presence for each user with Zod, and CRDT storage with{" "}
                    <Anchor href="https://yjs.dev/" target="_blank" rel="noreferrer noopener">
                        Yjs
                    </Anchor>{" "}
                    or{" "}
                    <Anchor href="https://loro.dev/" target="_blank" rel="noreferrer noopener">
                        Loro
                    </Anchor>{" "}
                    to unlock more realtime capabilities for your app.
                </p>
            </div>
            <HomeIntroCodeStep2 className="min-w-0 flex-1" />
        </PageContainer>
    );
};
