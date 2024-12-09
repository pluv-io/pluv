import type { ComponentProps } from "react";
import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import { FC } from "react";
import { HamburgerMenuButtonBar } from "./HamburgerMenuButtonBar";

export type HamburgerMenuButtonProps = ComponentProps<"button"> & {
    open?: boolean;
};

export const HamburgerMenuButton: FC<HamburgerMenuButtonProps> = ({ className, open, ...divProps }) => {
    return (
        <button
            type="button"
            aria-expanded={open}
            aria-label="Open menu"
            {...divProps}
            className={cn(
                "group flex size-11 items-center justify-center",
                "rounded-md border border-solid border-gray-300 bg-white",
                className,
            )}
        >
            <div className="relative size-6 cursor-pointer transition duration-300 ease-in-out">
                <HamburgerMenuButtonBar
                    className={cn(oneLine`
                        top-0.5
                        group-[[aria-expanded="true"]]:left-1/2
                        group-[[aria-expanded="true"]]:w-0
                    `)}
                />
                <HamburgerMenuButtonBar
                    className={cn(oneLine`
                        top-2.5
                        group-[[aria-expanded="true"]]:rotate-45
                        group-[[aria-expanded="true"]]:transform
                    `)}
                />
                <HamburgerMenuButtonBar
                    className={cn(oneLine`
                        top-2.5
                        group-[[aria-expanded="true"]]:-rotate-45
                        group-[[aria-expanded="true"]]:transform
                    `)}
                />
                <HamburgerMenuButtonBar
                    className={cn(oneLine`
                        top-[1.125rem]
                        group-[[aria-expanded="true"]]:left-1/2
                        group-[[aria-expanded="true"]]:w-0
                    `)}
                />
            </div>
        </button>
    );
};
