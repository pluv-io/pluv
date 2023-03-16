import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import { CSSProperties, FC, ReactNode } from "react";
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
    font-semibold
    transition-colors
    duration-150
    ease-in
    cursor-pointer
    hover:bg-slate-300/10
    focus:bg-slate-300/20
    active:bg-slate-300/40
    [[data-selected="true"]]:text-sky-500
    [[data-selected="true"]]:bg-slate-300/20
`;

export interface TreeViewLinkProps {
    children?: ReactNode;
    className?: string;
    href: string;
    rel?: string;
    selected?: boolean;
    style?: CSSProperties;
    target?: string;
}

export const TreeViewLink: FC<TreeViewLinkProps> = ({
    children,
    className,
    href,
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
