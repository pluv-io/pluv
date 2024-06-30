import { Code, PageContainer } from "@pluv-internal/react-components/either";
import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import type { FC } from "react";
import { HomeIntroStep4Code } from "./HomeIntroStep4Code";

export interface HomeIntroStep4Props {
    className?: string;
}

export const HomeIntroStep4: FC<HomeIntroStep4Props> = ({ className }) => {
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
                        4
                    </span>
                    <h3 className="text-xl font-semibold md:text-2xl">Wrap with PluvRoomProvider</h3>
                </div>
                <p className="mt-3 text-sm md:text-base">
                    The room bundle provides a <Code>PluvRoomProvider</Code> to wrap your page with. Once you do, your
                    app is now multiplayer with pluv.io!
                </p>
            </div>
            <HomeIntroStep4Code className="min-w-0 flex-1" />
        </PageContainer>
    );
};
