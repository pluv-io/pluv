import { PageContainer } from "@pluv-internal/react-components/either";
import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import type { CSSProperties, FC } from "react";
import { HomeIntroStep1 } from "../HomeIntroStep1";
import { HomeIntroStep2 } from "../HomeIntroStep2";
import { HomeIntroStep3 } from "../HomeIntroStep3";

export interface HomeIntroSectionProps {
    className?: string;
    style?: CSSProperties;
}

export const HomeIntroSection: FC<HomeIntroSectionProps> = ({ className, style }) => {
    return (
        <section
            className={cn(
                oneLine`
                    flex
                    flex-col
                    items-center
                    py-20
                `,
                className,
            )}
            style={style}
        >
            <PageContainer
                asChild
                className={oneLine`
                    flex
                    flex-col
                    items-center
                    text-center
                    text-2xl
                    font-bold
                    leading-tight
                    md:text-3xl
                `}
            >
                <h2>Developer-Focused APIs</h2>
            </PageContainer>
            <PageContainer
                asChild
                className={oneLine`
                	mt-4
                    flex
                    max-w-[32rem]
                    flex-col
                    items-center
                    text-center
                    text-sm
                    text-muted-foreground
                    md:text-base
                `}
            >
                <h3>Unlock powerful utilities to make building complex multiplayer experiences easier.</h3>
            </PageContainer>
            <div className="mt-12 flex w-full min-w-0 flex-col items-stretch gap-12 lg:gap-16">
                <HomeIntroStep1 />
                <HomeIntroStep2 />
                <HomeIntroStep3 />
            </div>
        </section>
    );
};
