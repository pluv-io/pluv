import { cn } from "@pluv-internal/utils";
import { Command as CmdkCommand } from "cmdk";
import { oneLine } from "common-tags";
import { ComponentPropsWithoutRef, ElementRef, forwardRef } from "react";

export type CommandItemProps = ComponentPropsWithoutRef<typeof CmdkCommand.Item> & {
    selected?: boolean;
};

export const CommandItem = forwardRef<ElementRef<typeof CmdkCommand.Item>, CommandItemProps>((props, ref) => {
    const { selected, "aria-selected": ariaSelected } = props;

    return (
        <CmdkCommand.Item
            {...props}
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
                    aria-selected:bg-accent
                    aria-selected:text-accent-foreground
                    data-[disabled="true"]:pointer-events-none
                    data-[disabled="true"]:opacity-50
                `,
                props.className,
            )}
            aria-selected={selected || ariaSelected}
            ref={ref}
        />
    );
});

CommandItem.displayName = CmdkCommand.Item.displayName;
