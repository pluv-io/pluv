import { PageContainer, Typist } from "@pluv-internal/react-components";
import { useMediaQuery, useNoSsr } from "@pluv-internal/react-hooks";
import dynamic from "next/dynamic";
import NextImage from "next/image";
import { rgba } from "polished";
import { CSSProperties, memo } from "react";
import tw, { styled, theme } from "twin.macro";

const HomeHeroRainfall = dynamic(() => import("./HomeHeroRainfall"), {
    ssr: false,
});

const Root = tw.div`
    relative
    flex
    flex-col
    items-center
    justify-center
    w-full
    h-[80vh]
    overflow-hidden
`;

const RainfallAbsoluteContainer = tw.div`
    absolute
    top-1/2
    left-1/2
    -translate-x-1/2
    -translate-y-1/2
    flex
    items-center
    justify-center
    min-w-[100vw]
    w-[1920px]
    overflow-hidden
`;

const RainfallContainer = tw.div`
    relative
    w-full
    aspect-[3/2]
`;

const RadialBackground = styled.div`
    ${tw`
        absolute
	    inset-0
    `}
    background-image: radial-gradient(
        80% 112% at center,
        ${theme`colors.slate.900`} 35%,
        ${rgba(theme`colors.slate.900`, 0)} 85%
    );

    @media (max-width: 992px) {
        background-image: radial-gradient(
            112% 90% at center center,
            ${theme`colors.slate.900`} 35%,
            ${rgba(theme`colors.slate.900`, 0)} 85%
        );
    }
`;

const Contents = tw.div`
    absolute
    inset-0
    w-full
    flex
    flex-col
    items-center
    justify-center
    py-24
    z-[1]
`;

const TagLine = tw.h1`
	flex
	flex-col
	items-center
	font-bold
    leading-tight
    text-white
    [font-size: 2.25rem]
	sm:[font-size: 3.125rem]
	md:[font-size: 5.75rem]
`;

const Line = tw.span`
	flex
	items-center
    whitespace-pre
`;

const Info = tw(PageContainer)`
    inline-block
    mt-5
    md:mt-10
	[max-width: 26rem]
	text-lg
	font-semibold
	text-blue-300
	text-center
	md:text-2xl
`;

const PoweredBy = tw.span`
	whitespace-nowrap
`;

export interface HomeHeroProps {
    className?: string;
    style?: CSSProperties;
}

export const HomeHero = memo<HomeHeroProps>(({ className, style }) => {
    const isDesktop = useMediaQuery("(min-width: 992px)", {
        initializeWithValue: false,
    });

    const noSsr = useNoSsr();
    const showRainfall = noSsr(isDesktop, false);

    return (
        <Root className={className} style={style}>
            <RainfallAbsoluteContainer>
                <RainfallContainer>
                    <NextImage
                        alt="rainfall hero"
                        className="absolute inset-0 object-cover"
                        fill
                        priority
                        src="/static/jpg/rainfall-background.jpg"
                    />
                    {showRainfall && (
                        <HomeHeroRainfall className="absolute inset-0" />
                    )}
                </RainfallContainer>
            </RainfallAbsoluteContainer>
            <RadialBackground />
            <Contents>
                <TagLine>
                    <Line>Typesafe</Line>
                    <Line>Real-Time APIs</Line>
                    <Line>
                        for{" "}
                        <Typist sentences={["Cloudflare", "Node.js", "React"]}>
                            <Typist.Cursor />
                        </Typist>
                    </Line>
                </TagLine>
                <Info as="h2">
                    Multiplayer APIs <PoweredBy>powered-by</PoweredBy>{" "}
                    TypeScript inference end-to-end
                </Info>
            </Contents>
        </Root>
    );
});

HomeHero.displayName = "HomeHero";
