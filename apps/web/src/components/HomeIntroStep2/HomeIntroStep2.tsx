import { Anchor, Code, PageContainer } from "@pluv-internal/react-components/either";
import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import type { FC } from "react";
import { HomeIntroStep2Code } from "./HomeIntroStep2Code";

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
                    <h3 className="text-xl font-semibold md:text-2xl">Set-up your HTTP and Websocket servers</h3>
                </div>
                <p className="mt-3 text-sm md:text-base">
                    Next, set-up our HTTP and WebSocket servers using our <Code>ioServer</Code>.
                    <br />
                    <br />
                    Set-up may vary between{" "}
                    <Anchor href="https://nodejs.org" target="_blank" rel="noreferrer noopener">
                        Node.js
                    </Anchor>{" "}
                    and{" "}
                    <Anchor href="https://workers.cloudflare.com/" target="_blank" rel="noreferrer noopener">
                        Cloudflare Worker
                    </Anchor>{" "}
                    runtimes.
                </p>
            </div>
            <HomeIntroStep2Code className="min-w-0 flex-1" />
        </PageContainer>
    );
};
