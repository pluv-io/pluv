import { Anchor, PageContainer } from "@pluv-internal/react-components/either";
import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import type { FC } from "react";
import { HomeIntroStep5Code } from "./HomeIntroStep5Code";

export interface HomeIntroStep5Props {
    className?: string;
}

export const HomeIntroStep5: FC<HomeIntroStep5Props> = ({ className }) => {
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
                        5
                    </span>
                    <h3 className="text-xl font-semibold md:text-2xl">Start building with realtime primitives!</h3>
                </div>
                <p className="mt-3 text-sm md:text-base">
                    With our frontend bundle ready to use, you can start using pluv.io realtime primitives with{" "}
                    <Anchor href="https://www.typescriptlang.org/" target="_blank" rel="noreferrer noopener">
                        TypeScript
                    </Anchor>{" "}
                    autocompletion and intellisense matching your backend events, presence and storage.
                    <br />
                    <br />
                    Type definitions will be as narrow as you&apos;ve configured, all while managing minimal TypeScript
                    type definitions and without code-generation!
                </p>
            </div>
            <HomeIntroStep5Code className="min-w-0 flex-1" />
        </PageContainer>
    );
};
