import {
    AppBar,
    Button,
    LogoIcon,
    NextLink,
    SideDrawer,
} from "@pluv-internal/react-components";
import { BarsIcon, GitHubIcon, NpmIcon } from "@pluv-internal/react-icons";
import { CSSProperties, memo } from "react";
import tw, { styled } from "twin.macro";
import { MobileDocsSideDrawer } from "../MobileDocsSideDrawer";

const Root = tw(AppBar)`
    flex
    flex-row
    items-stretch
    justify-center
`;

const Content = styled.div`
    ${tw`
        flex
        items-center
        justify-between
        w-full
    `}

    @media (min-width: 640px) {
        max-width: 640px;
    }

    @media (min-width: 768px) {
        max-width: 768px;
    }

    @media (min-width: 1024px) {
        max-width: 1024px;
    }

    @media (min-width: 1280px) {
        max-width: 1280px;
    }

    @media (min-width: 1536px) {
        max-width: 1536px;
    }
`;

const LeftContainer = tw.div`
    flex
    items-center
`;

const MobileDrawerButton = tw(Button)`
    mr-3
    lg:hidden
`;

const StyledMobileDocsSideDrawer = tw(MobileDocsSideDrawer)`
    lg:hidden
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

const RightContainer = tw.div`
    flex
    flex-row
    items-center
    gap-2
`;

export interface SiteWideAppBarProps {
    className?: string;
    style?: CSSProperties;
}

export const SiteWideAppBar = memo<SiteWideAppBarProps>((props) => {
    const { className, style } = props;

    return (
        <Root className={className} style={style}>
            <Content>
                <LeftContainer>
                    <SideDrawer.Root>
                        <SideDrawer.Trigger>
                            <MobileDrawerButton outlined square type="button">
                                <BarsIcon height={24} width={24} />
                            </MobileDrawerButton>
                        </SideDrawer.Trigger>
                        <StyledMobileDocsSideDrawer />
                    </SideDrawer.Root>
                    <Logo href="/">
                        <StyledLogoIcon height={36} width={36} />
                        <PluvName>pluv.io</PluvName>
                    </Logo>
                </LeftContainer>
                <RightContainer>
                    <Button
                        as={NextLink}
                        href="https://github.com/pluv-io/pluv"
                        outlined
                        rel="noreferrer noopener"
                        square
                        target="_blank"
                        title="GitHub"
                        aria-label="GitHub"
                    >
                        <GitHubIcon height={24} width={24} />
                    </Button>
                    <Button
                        as={NextLink}
                        href="https://www.npmjs.com/package/@pluv/io"
                        outlined
                        rel="noreferrer noopener"
                        square
                        target="_blank"
                        title="npm"
                        aria-label="npm"
                    >
                        <NpmIcon height={24} width={24} />
                    </Button>
                </RightContainer>
            </Content>
        </Root>
    );
});

SiteWideAppBar.displayName = "SiteWideAppBar";
