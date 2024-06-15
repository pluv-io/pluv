import { Typist } from "@pluv-internal/react-components/client";
import { PageContainer } from "@pluv-internal/react-components/either";
import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import type { CSSProperties } from "react";
import { memo } from "react";

export interface HomeHeroProps {
    className?: string;
    style?: CSSProperties;
}

export const HomeHero = memo<HomeHeroProps>(({ className, style }) => {
    return (
        <div
            className={cn(
                oneLine`
                    relative
                    flex
                    h-[80vh]
                    w-full
                    flex-col
                    items-center
                    justify-center
                    overflow-hidden
                `,
                className,
            )}
            style={style}
        >
            <div
                className={oneLine`
                    absolute
                    inset-0
                    z-[1]
                    flex
                    w-full
                    flex-col
                    items-center
                    justify-center
                    py-24
                `}
            >
                <h1
                    className={oneLine`
                    	flex
                        flex-col
                        items-center
                        text-[2.25rem]
                        font-bold
                        leading-tight
                        text-white
                        sm:text-[3.125rem]
                        md:text-[5.75rem]
                    `}
                >
                    <span className="flex items-center whitespace-pre">Typesafe</span>
                    <span className="flex items-center whitespace-pre">Real-Time APIs</span>
                    <span className="flex items-center whitespace-pre">
                        for{" "}
                        <Typist sentences={["Cloudflare", "Node.js", "React"]}>
                            <Typist.Cursor />
                        </Typist>
                    </span>
                </h1>
                <PageContainer
                    asChild
                    className={oneLine`
                        mt-5
                        inline-block
                        max-w-[26rem]
                        text-center
                        text-lg
                        font-semibold
                        text-blue-300
                        md:mt-10
                        md:text-2xl
                    `}
                >
                    <h2>
                        Multiplayer APIs <span className="whitespace-nowrap">powered-by</span> TypeScript inference
                        end-to-end
                    </h2>
                </PageContainer>
            </div>
        </div>
    );
});

HomeHero.displayName = "HomeHero";
