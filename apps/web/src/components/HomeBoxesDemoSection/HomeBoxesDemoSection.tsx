import { PageContainer } from "@pluv-internal/react-components";
import { CSSProperties, FC } from "react";
import tw from "twin.macro";
import { HomeCodeDemo } from "../HomeCodeDemo";

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

const CodeDemoContainer = tw(PageContainer)`
    flex
    items-center
    justify-center
    mt-12
`;

const StyledHomeCodeDemo = tw(HomeCodeDemo)`
    w-full
`;

export interface HomeBoxesDemoSectionProps {
    className?: string;
    style?: CSSProperties;
}

export const HomeBoxesDemoSection: FC<HomeBoxesDemoSectionProps> = ({
    className,
    style,
}) => {
    return (
        <Root className={className} style={style}>
            <Title as="h2">Simple-to-use APIs</Title>
            <Info as="h3">
                Configure your server and client to unlock intuitive APIs that
                allow you to focus on your end-user experience.
            </Info>
            <CodeDemoContainer>
                <StyledHomeCodeDemo />
            </CodeDemoContainer>
        </Root>
    );
};
