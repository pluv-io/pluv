import { Anchor, PageContainer } from "@pluv-internal/react-components/either";
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
                    title="Automatic Type-safety"
                />
                <HomeFeaturesSectionFeature
                    description="Build for either Cloudflare Workers or Node.js runtimes."
                    title="Multi-runtime"
                />
                <HomeFeaturesSectionFeature
                    description="Edit shared data and documents with the Yjs or Loro ecosystems."
                    title="Multi-CRDT"
                />
                <HomeFeaturesSectionFeature
                    description="Have users directly interact with eachother in realtime with per-user states."
                    title="Presence"
                />
                <HomeFeaturesSectionFeature
                    description="Add your own custom authentication rules to rooms and give each user their own identity."
                    title="Authentication & Identity"
                />
                <HomeFeaturesSectionFeature
                    description={
                        <span>
                            Pluv is designed for self-hosting first with documented instructions{" "}
                            <Anchor
                                href="/docs/io/node-js"
                                title="Node.js"
                                aria-description="Node.js hosting instructions"
                            >
                                here
                            </Anchor>{" "}
                            and{" "}
                            <Anchor
                                href="/docs/io/cloudflare-workers"
                                title="Cloudflare"
                                aria-description="Cloudflare hosting instructions"
                            >
                                here
                            </Anchor>
                            .
                        </span>
                    }
                    title="No Vendor Lock"
                />
            </PageContainer>
        </section>
    );
};
