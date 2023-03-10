import type { CSSProperties, FC } from "react";
import tw from "twin.macro";
import { HomeCodeDemoBrowser } from "./HomeCodeDemoBrowser";

const Root = tw.div`
    flex
    flex-row
    items-stretch
    gap-[0]
    sm:gap-[16px]
    md:gap-[32px]
    md:flex-col
`;

const UserDemo = tw(HomeCodeDemoBrowser)`
    grow
    basis-0
    min-h-0
    rounded-md
    first:rounded-r-none
    last:rounded-l-none
    sm:first:rounded-r-md
    sm:last:rounded-l-md
`;

export interface HomeCodeDemoUserDemoProps {
    className?: string;
    style?: CSSProperties;
}

export const HomeCodeDemoUserDemo: FC<HomeCodeDemoUserDemoProps> = ({
    className,
    style,
}) => {
    return (
        <Root className={className} style={style}>
            <UserDemo id="user1" user="jane" />
            <UserDemo id="user2" user="john" />
        </Root>
    );
};
