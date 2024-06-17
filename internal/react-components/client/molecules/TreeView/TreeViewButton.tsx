import { cn } from "@pluv-internal/utils";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import { oneLine } from "common-tags";
import type { CSSProperties, FC, ReactNode } from "react";

export interface TreeViewButtonProps {
    children?: ReactNode;
    className?: string;
    onClick?: () => void;
    selected?: boolean;
    style?: CSSProperties;
}

export const TreeViewButton: FC<TreeViewButtonProps> = ({ children, className, onClick, selected = false, style }) => {
    return (
        <NavigationMenu.Item className={cn("flex flex-col items-stretch", className)} style={style}>
            <button
                className={oneLine`
                    flex
                    h-8
                    cursor-pointer
                    flex-row
                    items-center
                    rounded
                    px-3
                    font-semibold
                    transition-colors
                    duration-150
                    ease-in
                    hover:bg-accent-foreground
                    focus:bg-accent-foreground
                    active:bg-accent-foreground
                    [&[data-selected="true"]]:bg-accent
                    [&[data-selected="true"]]:text-sky-600
                `}
                onClick={onClick}
                data-selected={selected}
            >
                {children}
            </button>
        </NavigationMenu.Item>
    );
};
