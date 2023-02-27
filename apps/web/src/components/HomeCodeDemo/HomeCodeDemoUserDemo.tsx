import type { CSSProperties, FC } from "react";
import tw from "twin.macro";
import { HomeCodeDemoBrowser } from "./HomeCodeDemoBrowser";

const Root = tw.div`
    flex
    flex-col
    items-stretch
    gap-[32px]
`;

const UserDemo = tw(HomeCodeDemoBrowser)`
    grow
    basis-0
    min-h-0
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
            <UserDemo id="user1" />
            <UserDemo id="user2" />
        </Root>
    );
};
