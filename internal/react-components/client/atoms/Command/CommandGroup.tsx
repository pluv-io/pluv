import { cn } from "@pluv-internal/utils";
import { Command as CmdkCommand } from "cmdk";
import { oneLine } from "common-tags";
import { ComponentPropsWithoutRef, ElementRef, forwardRef } from "react";

export type CommandGroupProps = ComponentPropsWithoutRef<typeof CmdkCommand.Group>;

export const CommandGroup = forwardRef<ElementRef<typeof CmdkCommand.Group>, CommandGroupProps>(
    ({ className, ...props }, ref) => (
        <CmdkCommand.Group
            ref={ref}
            className={cn(
                oneLine`
                overflow-hidden
                p-1
                text-foreground
                [&_[cmdk-group-heading]]:px-2
                [&_[cmdk-group-heading]]:py-1.5
                [&_[cmdk-group-heading]]:text-xs
                [&_[cmdk-group-heading]]:font-medium
                [&_[cmdk-group-heading]]:text-muted-foreground
                [&_[cmdk-group-items]]:flex
                [&_[cmdk-group-items]]:flex-col
                [&_[cmdk-group-items]]:items-stretch
            `,
                className,
            )}
            {...props}
        />
    ),
);

CommandGroup.displayName = CmdkCommand.Group.displayName;
