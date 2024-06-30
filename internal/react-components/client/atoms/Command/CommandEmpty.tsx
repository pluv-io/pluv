import { Command as CmdkCommand, useCommandState } from "cmdk";
import { ComponentPropsWithoutRef, ElementRef, forwardRef } from "react";

export type CommandEmptyProps = ComponentPropsWithoutRef<typeof CmdkCommand.Empty>;

export const CommandEmpty = forwardRef<ElementRef<typeof CmdkCommand.Empty>, CommandEmptyProps>((props, ref) => {
    const render = useCommandState((state) => state.filtered.count === 0);

    if (!render) return null;

    return <div ref={ref} className="py-6 text-center text-sm" cmdk-empty="" {...props} />;
});

CommandEmpty.displayName = CmdkCommand.Empty.displayName;
