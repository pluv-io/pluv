import { PageContainer } from "@pluv-internal/react-components/either";
import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import type { CSSProperties, FC } from "react";

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
                    py-24
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
                    text-3xl
                    font-bold
                    leading-tight
                    md:text-5xl
                `}
            >
                <h2>Multiplayer made easy</h2>
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
                    text-slate-300
                `}
            >
                <h3>Pluv provides powerful utilities to make building complex multiplayer experiences easier.</h3>
            </PageContainer>
            <PageContainer className="mt-12 flex items-center justify-center" />
        </section>
    );
};
