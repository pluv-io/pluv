import { cn } from "@pluv-internal/utils";
import { Command as CmdkCommand } from "cmdk";
import { ComponentPropsWithoutRef, ElementRef, forwardRef } from "react";

export type CommandSeparatorProps = ComponentPropsWithoutRef<typeof CmdkCommand.Separator>;

export const CommandSeparator = forwardRef<ElementRef<typeof CmdkCommand.Separator>, CommandSeparatorProps>(
    ({ className, ...props }, ref) => {
        return <CmdkCommand.Separator ref={ref} className={cn("-mx-1 h-px bg-border", className)} {...props} />;
    },
);

CommandSeparator.displayName = CmdkCommand.Separator.displayName;
