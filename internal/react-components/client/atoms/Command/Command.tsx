import { cn } from "@pluv-internal/utils";
import { Command as CmdkCommand } from "cmdk";
import { oneLine } from "common-tags";
import { ComponentPropsWithoutRef, ElementRef, forwardRef } from "react";

export type CommandProps = ComponentPropsWithoutRef<typeof CmdkCommand>;

export const Command = forwardRef<ElementRef<typeof CmdkCommand>, CommandProps>(({ className, ...props }, ref) => {
    return (
        <CmdkCommand
            ref={ref}
            className={cn(
                oneLine`
                        flex
                        h-full
                        w-full
                        flex-col
                        overflow-hidden
                        rounded-md
                        bg-popover
                        text-popover-foreground
                    `,
                className,
            )}
            {...props}
        />
    );
});

Command.displayName = CmdkCommand.displayName;
