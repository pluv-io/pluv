import { ChevronDownIcon } from "@pluv-internal/react-icons";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import { CSSProperties, FC, ReactNode } from "react";
import tw, { styled } from "twin.macro";
import { NextLink, Pill } from "../../atoms";

const Delimiter = tw(ChevronDownIcon)`
    -rotate-90
`;

const Root = styled(NavigationMenu.Item)`
    ${tw`
        flex
        flex-row
        items-center
        gap-2
    `}

    &:last-child > ${Delimiter} {
        ${tw`hidden`}
    }
`;

const Link = tw(Pill)`
    [font-size: inherit]
    hover:text-sky-500
    [&[data-selected="true"]]:text-sky-500
`;

export interface BreadcrumbsItemProps {
    "aria-label"?: string;
    children?: ReactNode;
    className?: string;
    href: string;
    selected?: boolean;
    style?: CSSProperties;
    title?: string;
}

export const BreadcrumbsItem: FC<BreadcrumbsItemProps> = ({
    "aria-label": ariaLabel,
    children,
    className,
    href,
    selected = false,
    style,
    title,
}) => {
    return (
        <Root className={className} style={style}>
            <NavigationMenu.Link asChild>
                <Link
                    as={NextLink}
                    href={href}
                    title={title}
                    aria-label={ariaLabel}
                    data-selected={selected}
                >
                    {children}
                </Link>
            </NavigationMenu.Link>
            <Delimiter height={16} width={16} />
        </Root>
    );
};
