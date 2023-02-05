import { PageContainer, Typist } from "@pluv-internal/react-components";
import dynamic from "next/dynamic";
import NextImage from "next/image";
import { rgba } from "polished";
import { CSSProperties, memo } from "react";
import tw, { styled, theme } from "twin.macro";

const Root = tw.div`
    relative
    flex
    flex-col
    items-center
    justify-center
    w-full
    h-screen
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

const HomeHeroRainfall = dynamic(() => import("./HomeHeroRainfall"), {
    ssr: false,
});

const RadialBackground = styled.div`
    ${tw`
        absolute
	    inset-0
    `}
    background-image: radial-gradient(
        80% 100% at center,
        ${theme`colors.slate.900`} 35%,
        ${rgba(theme`colors.slate.900`, 0)} 75%
    );
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
	[font-size: 3.125rem]
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
	text-gray-500
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
                    <HomeHeroRainfall className="absolute inset-0" />
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
