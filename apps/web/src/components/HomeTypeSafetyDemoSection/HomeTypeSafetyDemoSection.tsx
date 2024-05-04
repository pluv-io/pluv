import { PageContainer } from "@pluv-internal/react-components";
import { CSSProperties, FC } from "react";
import tw from "twin.macro";
import { HomeTypeSafetyDemo } from "../HomeTypeSafetyDemo";

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
	[max-width: 32rem]
    mt-4
	text-lg
	text-center
    text-slate-300
`;

const TypeSafetyDemoContainer = tw(PageContainer)`
    flex
    items-center
    justify-center
    mt-12
`;

const StyledTypeSafetyDemo = tw(HomeTypeSafetyDemo)`
    w-full
`;

export interface HomeTypeSafetyDemoSectionProps {
    className?: string;
    style?: CSSProperties;
}

export const HomeTypeSafetyDemoSection: FC<HomeTypeSafetyDemoSectionProps> = ({ className, style }) => {
    return (
        <Root className={className} style={style}>
            <Title as="h2">End-to-end Type-Safety</Title>
            <Info as="h3">Get intellisense and autocomplete, so you can move fast and catch errors in development</Info>
            <TypeSafetyDemoContainer>
                <StyledTypeSafetyDemo />
            </TypeSafetyDemoContainer>
        </Root>
    );
};
