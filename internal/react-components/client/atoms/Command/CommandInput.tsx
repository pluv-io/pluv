import { SearchIcon } from "@pluv-internal/react-icons";
import { cn } from "@pluv-internal/utils";
import { Command as CmdkCommand } from "cmdk";
import { oneLine } from "common-tags";
import { ComponentPropsWithoutRef, ElementRef, forwardRef } from "react";

export type CommandInputProps = ComponentPropsWithoutRef<typeof CmdkCommand.Input>;

export const CommandInput = forwardRef<ElementRef<typeof CmdkCommand.Input>, CommandInputProps>(
    ({ className, ...props }, ref) => (
        <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
            <SearchIcon className="mr-2 size-4 shrink-0 opacity-50" height={16} width={16} />
            <CmdkCommand.Input
                ref={ref}
                className={cn(
                    oneLine`
                    flex
                    h-11
                    w-full
                    rounded-md
                    bg-transparent
                    py-3
                    text-sm
                    outline-none
                    placeholder:text-muted-foreground
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                `,
                    className,
                )}
                {...props}
            />
        </div>
    ),
);

CommandInput.displayName = CmdkCommand.Input.displayName;
