import { PageContainer } from "@pluv-internal/react-components/either";
import { CSSProperties, FC } from "react";
import tw from "twin.macro";
import { HomeCodeDemo } from "../HomeCodeDemo";

const Root = tw.section`
    flex
    flex-col
    items-center
    py-24
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
    mt-4
    max-w-[32rem]
	text-lg
	text-center
    text-slate-300
`;

const CodeDemoContainer = tw(PageContainer)`
    flex
    items-center
    justify-center
    mt-12
`;

const StyledCodeDemo = tw(HomeCodeDemo)`
    w-full
`;

export interface HomeBoxesDemoSectionProps {
    className?: string;
    style?: CSSProperties;
}

export const HomeBoxesDemoSection: FC<HomeBoxesDemoSectionProps> = ({ className, style }) => {
    return (
        <Root className={className} style={style}>
            <Title as="h2">Simple-to-use APIs</Title>
            <Info as="h3">
                Configure your server and client to unlock intuitive APIs that allow you to focus on your end-user
                experience.
            </Info>
            <CodeDemoContainer>
                <StyledCodeDemo />
            </CodeDemoContainer>
        </Root>
    );
};
