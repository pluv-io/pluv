import { PageContainer } from "@pluv-internal/react-components";
import { oneLine } from "common-tags";
import type { CSSProperties, FC } from "react";
import tw from "twin.macro";
import { HomeFeaturesSectionFeature } from "./HomeFeaturesSectionFeature";

const Root = tw.section`
    flex
    flex-col
    items-center
    pt-24
    pb-28
`;

const Features = tw(PageContainer)`
    grid
    grid-cols-1
    gap-6
    max-w-[1200px]
    md:grid-cols-2
    lg:grid-cols-3
`;

const Feature = tw(HomeFeaturesSectionFeature)``;

export interface HomeFeaturesSectionProps {
    className?: string;
    style?: CSSProperties;
}

export const HomeFeaturesSection: FC<HomeFeaturesSectionProps> = ({
    className,
    style,
}) => {
    return (
        <Root className={className} style={style}>
            <Features>
                <Feature
                    description="Get auto-completion and in-code errors with end-to-end type-safety."
                    title="Type-safety"
                />
                <Feature
                    description="Build for either Cloudflare Workers or Node.js runtimes."
                    title="Multi-runtime"
                />
                <Feature
                    description="Edit shared data and documents with the Yjs ecosystem."
                    title="Yjs CRDT"
                />
                <Feature
                    description="Display user selections with presence states defined per-user"
                    title="Presence"
                />
                <Feature
                    description={oneLine`
                    Pluv.io makes it easy to add your own custom authentication
                    rules to rooms.
                `}
                    title="Authentication"
                />
                <Feature
                    description="Broadcast custom events to connected clients in the same room."
                    title="Broadcast"
                />
            </Features>
        </Root>
    );
};