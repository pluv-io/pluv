import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import { CSSProperties, FC, ReactNode } from "react";
import tw from "twin.macro";

const Root = tw(NavigationMenu.Item)`
    flex
    flex-col
    items-stretch
`;

const Item = tw.button`
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
    [&[data-selected="true"]]:text-sky-500
    [&[data-selected="true"]]:bg-slate-300/20
`;

export interface TreeViewButtonProps {
    children?: ReactNode;
    className?: string;
    onClick?: () => void;
    selected?: boolean;
    style?: CSSProperties;
}

export const TreeViewButton: FC<TreeViewButtonProps> = ({
    children,
    className,
    onClick,
    selected = false,
    style,
}) => {
    return (
        <Root className={className} style={style}>
            <Item onClick={onClick} data-selected={selected}>
                {children}
            </Item>
        </Root>
    );
};
