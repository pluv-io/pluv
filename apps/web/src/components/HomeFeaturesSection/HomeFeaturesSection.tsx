import { PageContainer } from "@pluv-internal/react-components/either";
import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import type { CSSProperties, FC } from "react";
import { HomeFeaturesSectionFeature } from "./HomeFeaturesSectionFeature";

export interface HomeFeaturesSectionProps {
    className?: string;
    style?: CSSProperties;
}

export const HomeFeaturesSection: FC<HomeFeaturesSectionProps> = ({ className, style }) => {
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
                className={oneLine`
                    grid
                    max-w-screen-xl
                    auto-rows-fr
                    grid-cols-1
                    gap-6
                    md:grid-cols-2
                    lg:grid-cols-3
                `}
            >
                <HomeFeaturesSectionFeature
                    description="Get auto-completion and in-code errors with end-to-end type-safety."
                    title="Type-safety"
                />
                <HomeFeaturesSectionFeature
                    description="Build for either Cloudflare Workers or Node.js runtimes."
                    title="Multi-runtime"
                />
                <HomeFeaturesSectionFeature
                    description="Edit shared data and documents with the Yjs ecosystem."
                    title="Yjs CRDT"
                />
                <HomeFeaturesSectionFeature
                    description="Display user selections with per-user presence states."
                    title="Presence"
                />
                <HomeFeaturesSectionFeature
                    description="Add your own custom authentication rules to rooms."
                    title="Authentication"
                />
                <HomeFeaturesSectionFeature
                    description="Broadcast custom events to connected clients in the same room."
                    title="Broadcast"
                />
            </PageContainer>
        </section>
    );
};
