import { cn } from "@pluv-internal/utils";
import { Command as CmdkCommand } from "cmdk";
import { ComponentPropsWithoutRef, ElementRef, forwardRef } from "react";

export const CommandList = forwardRef<
    ElementRef<typeof CmdkCommand.List>,
    ComponentPropsWithoutRef<typeof CmdkCommand.List>
>(({ className, ...props }, ref) => {
    return (
        <CmdkCommand.List
            ref={ref}
            className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}
            {...props}
        />
    );
});

CommandList.displayName = CmdkCommand.List.displayName;
