import { PageContainer } from "@pluv-internal/react-components";
import { CSSProperties, FC } from "react";
import tw from "twin.macro";
import { HomeChessDemo } from "../HomeChessDemo";

const Root = tw.section`
    flex
    flex-col
    items-center
    pt-24
    pb-28
`;

const Title = tw(PageContainer)`
    flex
    flex-col
    items-center
    text-3xl
    leading-tight
    font-bold
    md:text-5xl
    text-center
`;

const Info = tw(PageContainer)`
	flex
	flex-col
	items-center
	[max-width: 32rem]
    mt-4
	text-lg
	text-center
    text-slate-300
`;

const ChessDemoContainer = tw(PageContainer)`
    flex
    items-center
    justify-center
    mt-12
`;

const StyledHomeChessDemo = tw(HomeChessDemo)`
    w-screen
`;

export interface HomeIntroSectionProps {
    className?: string;
    style?: CSSProperties;
}

export const HomeIntroSection: FC<HomeIntroSectionProps> = ({
    className,
    style,
}) => {
    return (
        <Root className={className} style={style}>
            <Title as="h2">Multiplayer made easy</Title>
            <Info as="h3">
                Pluv provides powerful utilities to make building complex
                multiplayer experiences easier.
            </Info>
            <ChessDemoContainer>
                <StyledHomeChessDemo />
            </ChessDemoContainer>
        </Root>
    );
};
