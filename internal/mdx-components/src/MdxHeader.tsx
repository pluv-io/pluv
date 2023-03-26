import { Anchor } from "@pluv-internal/react-components";
import { LinkIcon } from "@pluv-internal/react-icons";
import { CSSProperties, FC, ReactNode, useMemo } from "react";
import tw, { styled } from "twin.macro";

const StyledLinkIcon = tw(LinkIcon)`
    hidden
    [height: 0.625em]
    [width: 0.625em]
    ml-[0.3em]
    opacity-0
    transition-opacity
    duration-75
    ease-in
    sm:inline
`;

const Root = styled(Anchor)`
    ${tw`
        flex
        flex-row
        flex-nowrap
        items-center
        mb-[0.6em]
        not-first:mt-[1em]
        [& + p]:mt-0
    `}

    &:hover ${StyledLinkIcon} {
        ${tw`opacity-100`}
    }
`;

const Header = tw.header`
    inline
`;

export interface MdxHeaderProps {
    children?: ReactNode;
    className?: string;
    style?: CSSProperties;
    type?: "header" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

export const MdxHeader: FC<MdxHeaderProps> = ({
    children,
    className,
    style,
    type: HeaderType = "header",
}) => {
    const content = typeof children === "string" ? children : "";

    const hash = useMemo(() => {
        return content
            .replace(/\s+/g, "-")
            .replace(/"/g, "")
            .replace(/\((.+)\)/g, ".$1")
            .replace(/[^a-zA-Z0-9-\.]/g, "");
    }, [content]);

    return (
        <Root className={className} href={`#${hash}`} style={style}>
            <Header as={HeaderType} id={hash}>
                {children}
                <StyledLinkIcon height={24} width={24} />
            </Header>
        </Root>
    );
};
