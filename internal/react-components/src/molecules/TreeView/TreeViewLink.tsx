import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import { CSSProperties, FC, MouseEvent, ReactNode } from "react";
import tw from "twin.macro";
import { NextLink } from "../../atoms";

const Root = tw(NavigationMenu.Item)`
    flex
    flex-col
    items-stretch
`;

const Item = tw(NextLink)`
    flex
    flex-row
    items-center
    h-8
    px-3
    rounded
    text-sm
    transition-colors
    duration-150
    ease-in
    cursor-pointer
    text-slate-400
    hover:bg-slate-300/10
    hover:text-white
    focus:bg-slate-300/20
    focus:text-white
    active:bg-slate-300/40
    active:text-white
    [&[data-selected="true"]]:text-sky-500
    [&[data-selected="true"]]:bg-slate-300/20
`;

export interface TreeViewLinkProps {
    children?: ReactNode;
    className?: string;
    href: string;
    onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
    rel?: string;
    selected?: boolean;
    style?: CSSProperties;
    target?: string;
}

export const TreeViewLink: FC<TreeViewLinkProps> = ({
    children,
    className,
    href,
    onClick,
    rel,
    selected = false,
    style,
    target,
}) => {
    return (
        <Root className={className} style={style}>
            <NavigationMenu.Link asChild>
                <Item
                    href={href}
                    onClick={onClick}
                    rel={rel}
                    target={target}
                    data-selected={selected}
                >
                    {children}
                </Item>
            </NavigationMenu.Link>
        </Root>
    );
};
