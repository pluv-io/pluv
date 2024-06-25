import { Typist, TypistCursor } from "@pluv-internal/react-components/client";
import { Button, NextLink, PageContainer } from "@pluv-internal/react-components/either";
import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import type { CSSProperties } from "react";
import { memo } from "react";
import { HomeDemo } from "../HomeDemo";

export interface HomeHeroProps {
    className?: string;
    style?: CSSProperties;
}

export const HomeHero = memo<HomeHeroProps>(({ className, style }) => {
    return (
        <div
            className={cn(
                oneLine`
                    flex
                    w-full
                    flex-col
                    items-center
                    justify-center
                    overflow-hidden
                    py-24
                `,
                className,
            )}
            style={style}
        >
            <h1
                className={oneLine`
                    flex
                    flex-col
                    items-center
                    text-center
                    text-5xl
                    font-bold
                    leading-tight
                    tracking-tighter
                    md:text-7xl
                    lg:leading-[1.1]
                `}
            >
                <span className="flex items-center whitespace-pre">TypeSafe Primitives</span>
                <span className="flex items-center whitespace-pre">for a Realtime Web</span>
            </h1>
            <PageContainer
                asChild
                className={oneLine`
                    mt-3
                    inline-block
                    max-w-[564px]
                    text-center
                    text-lg
                    font-light
                    text-foreground
                    md:mt-5
                    md:max-w-[750px]
                `}
            >
                <h2>
                    Open Source, multiplayer APIs <span className="whitespace-nowrap">powered-by</span>{" "}
                    <span
                        className={oneLine`
                            font-medium
                            underline
                            decoration-rose-500
                            decoration-wavy
                            decoration-from-font
                            underline-offset-2
                        `}
                        style={{ textDecorationSkipInk: "none" }}
                    >
                        TypeScript
                    </span>{" "}
                    inference end-to-end.
                </h2>
            </PageContainer>
            <div className="mt-6 flex w-full items-center justify-center space-x-4">
                <Button asChild>
                    <NextLink href="/docs/introduction">Get Started</NextLink>
                </Button>
                <Button asChild variant="outline">
                    <NextLink href="/docs/quickstart">Quickstart</NextLink>
                </Button>
            </div>
        </div>
    );
});

HomeHero.displayName = "HomeHero";
