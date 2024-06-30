import { Anchor, Code, PageContainer } from "@pluv-internal/react-components/either";
import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import type { FC } from "react";
import { HomeIntroStep3Code } from "./HomeIntroStep3Code";

export interface HomeIntroStep3Props {
    className?: string;
}

export const HomeIntroStep3: FC<HomeIntroStep3Props> = ({ className }) => {
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
                        3
                    </span>
                    <h3 className="text-xl font-semibold md:text-2xl">Prepare your frontend bundle</h3>
                </div>
                <p className="mt-3 text-sm md:text-base">
                    Afterwards, we will prepare our frontend bundle by using a type import of our <Code>IOServer</Code>.
                    This frontend bundle contains all of pluv.io&apos;s APIs for realtime collaboration.
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
            <HomeIntroStep3Code className="min-w-0 flex-1" />
        </PageContainer>
    );
};
