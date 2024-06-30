import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import { FC } from "react";

export interface HamburgerMenuButtonBarProps {
    className?: string;
}

export const HamburgerMenuButtonBar: FC<HamburgerMenuButtonBarProps> = ({ className }) => {
    return (
        <div
            className={cn(
                oneLine`
                    absolute
                    left-0
                    h-1
                    w-full
                    rotate-0
                    transform
                    rounded-full
                    bg-black
                    opacity-100
                    transition-all
                    duration-150
                    ease-in-out
                `,
                className,
            )}
        />
    );
};
