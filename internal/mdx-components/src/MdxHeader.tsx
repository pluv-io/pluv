import { NextLink } from "@pluv-internal/react-components";
import { LinkIcon } from "@pluv-internal/react-icons";
import { CSSProperties, FC, ReactNode, useMemo } from "react";
import tw from "twin.macro";

const Root = tw(NextLink)`
    flex
    flex-row
    flex-nowrap
    items-center
    gap-[0.3em]
    mb-[0.8em]
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
            .replace(/[^a-zA-Z0-9-]/g, "")
            .toLowerCase();
    }, [content]);

    return (
        <Root id={hash} className={className} href={`#${hash}`} style={style}>
            <HeaderType>{children}</HeaderType>
            <LinkIcon height="0.5em" width="0.5em" />
        </Root>
    );
};