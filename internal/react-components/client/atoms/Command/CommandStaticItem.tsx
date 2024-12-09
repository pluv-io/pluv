import type { ComponentProps } from "react";
import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import { forwardRef } from "react";

export type CommandStaticItemProps = ComponentProps<"button">;

export const CommandStaticItem = forwardRef<HTMLButtonElement, CommandStaticItemProps>(
    ({ className, ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    oneLine`
                    relative
                    flex
                    cursor-pointer
                    select-none
                    items-center
                    rounded-sm
                    px-2
                    py-1.5
                    text-sm
                    outline-none
                    hover:bg-accent
                    hover:text-accent-foreground
                    disabled:pointer-events-none
                    disabled:opacity-50
                `,
                    className,
                )}
                type="button"
                {...props}
            />
        );
    },
);

CommandStaticItem.displayName = "CommandStaticItem";
