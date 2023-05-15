import {
    Button,
    LogoIcon,
    NextLink,
    SideDrawer,
} from "@pluv-internal/react-components";
import { XIcon } from "@pluv-internal/react-icons";
import { CSSProperties, FC, MouseEvent } from "react";
import tw from "twin.macro";
import { DocsTreeViewNavigation } from "../DocsTreeViewNavigation";

const Root = tw(SideDrawer)`
    flex
    flex-col
    items-stretch
`;

const TopContainer = tw.div`
    shrink-0
    flex
    flex-row
    items-center
    justify-between
    py-2
    px-4
`;

const Logo = tw(NextLink)`
    flex
    items-center
    gap-1.5
`;

const StyledLogoIcon = tw(LogoIcon)`
    rounded-md
`;

const PluvName = tw.span`
    text-lg
    font-bold
`;

const StyledTreeView = tw(DocsTreeViewNavigation)`
    grow
    min-h-0
    overflow-y-auto
`;

export interface MobileDocsSideDrawerProps {
    className?: string;
    onClickLink?: (event: MouseEvent<HTMLAnchorElement>) => void;
    style?: CSSProperties;
}

export const MobileDocsSideDrawer: FC<MobileDocsSideDrawerProps> = ({
    className,
    onClickLink,
    style,
}) => {
    return (
        <Root className={className} style={style}>
            <TopContainer>
                <Logo href="/">
                    <StyledLogoIcon height={36} width={36} />
                    <PluvName>pluv.io</PluvName>
                </Logo>
                <SideDrawer.Close>
                    <Button outlined size="small" square type="button">
                        <XIcon height={24} width={24} />
                    </Button>
                </SideDrawer.Close>
            </TopContainer>
            <StyledTreeView onClickLink={onClickLink} />
        </Root>
    );
};
