import {
    Button,
    Footer,
    LogoIcon,
    NextLink,
} from "@pluv-internal/react-components";
import { GitHubIcon, NpmIcon } from "@pluv-internal/react-icons";
import { CSSProperties, memo } from "react";
import tw, { styled } from "twin.macro";

const Root = tw(Footer)`
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

const LinksContainer = tw.div`
    flex
    flex-row
    items-center
    gap-2
`;

const ExternalLink = tw(NextLink)`
    flex
    flex-row
    items-center
    justify-center
    gap-2
    w-28
`;

export interface SiteWideFooterProps {
    className?: string;
    style?: CSSProperties;
}

export const SiteWideFooter = memo<SiteWideFooterProps>((props) => {
    const { className, style } = props;

    return (
        <Root className={className} style={style}>
            <Content>
                <Logo href="/">
                    <StyledLogoIcon height={40} width={40} />
                    <PluvName>pluv.io</PluvName>
                </Logo>
                <LinksContainer>
                    <Button
                        as={ExternalLink}
                        href="https://github.com/pluv-io/pluv"
                        outlined
                        rel="noreferrer noopener"
                        size="small"
                        target="_blank"
                        title="GitHub"
                        aria-label="GitHub"
                    >
                        <GitHubIcon height={16} width={16} />
                        <span>GitHub</span>
                    </Button>
                    <Button
                        as={ExternalLink}
                        href="https://www.npmjs.com/package/@pluv/io"
                        outlined
                        rel="noreferrer noopener"
                        size="small"
                        target="_blank"
                        title="npm"
                        aria-label="npm"
                    >
                        <NpmIcon height={16} width={16} />
                        <span>npm</span>
                    </Button>
                </LinksContainer>
            </Content>
        </Root>
    );
});

SiteWideFooter.displayName = "SiteWideFooter";
