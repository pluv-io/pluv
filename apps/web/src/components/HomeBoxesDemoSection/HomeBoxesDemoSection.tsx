import { PageContainer } from "@pluv-internal/react-components/either";
import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import type { CSSProperties, FC } from "react";
import { HomeCodeDemo } from "../HomeCodeDemo";

export interface HomeBoxesDemoSectionProps {
    className?: string;
    style?: CSSProperties;
}

export const HomeBoxesDemoSection: FC<HomeBoxesDemoSectionProps> = ({ className, style }) => {
    return (
        <section className={cn("flex flex-col items-center py-24", className)} style={style}>
            <PageContainer
                asChild
                className={oneLine`
                    flex
                    flex-col
                    items-center
                    text-center
                    text-3xl
                    font-bold
                    leading-tight
                    md:text-5xl
                `}
            >
                <h2>Simple-to-use APIs</h2>
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
                    text-lg
                    text-muted-foreground
                `}
            >
                <h3>
                    Configure your server and client to unlock intuitive APIs that allow you to focus on your end-user
                    experience.
                </h3>
            </PageContainer>
            <PageContainer className="mt-12 flex w-full max-w-screen-xl flex-col items-stretch justify-center">
                <HomeCodeDemo />
            </PageContainer>
        </section>
    );
};
