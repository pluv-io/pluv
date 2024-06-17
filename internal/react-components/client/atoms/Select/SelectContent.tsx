import type { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import * as RadixSelect from "@radix-ui/react-select";
import { oneLine } from "common-tags";
import type { ElementRef } from "react";
import { forwardRef } from "react";
import { SelectScrollDownButton } from "./SelectScrollDownButton";
import { SelectScrollUpButton } from "./SelectScrollUpButton";

export type SelectContentProps = InferComponentProps<typeof RadixSelect.Content>;

export const SelectContent = forwardRef<ElementRef<typeof RadixSelect.Content>, SelectContentProps>((props, ref) => {
    const { className, children, position = "popper", ...restProps } = props;

    return (
        <RadixSelect.Portal>
            <RadixSelect.Content
                {...restProps}
                ref={ref}
                className={cn(
                    oneLine`
                        relative
                        z-50
                        max-h-96
                        min-w-32
                        overflow-hidden
                        rounded-md
                        border
                        bg-popover
                        text-popover-foreground
                        shadow-md
                        data-[state=open]:animate-in
                        data-[state=closed]:animate-out
                        data-[state=closed]:fade-out-0
                        data-[state=open]:fade-in-0
                        data-[state=closed]:zoom-out-95
                        data-[state=open]:zoom-in-95
                        data-[side=bottom]:slide-in-from-top-2
                        data-[side=left]:slide-in-from-right-2
                        data-[side=right]:slide-in-from-left-2
                        data-[side=top]:slide-in-from-bottom-2
                    `,
                    position === "popper" &&
                        oneLine`
                            data-[side=bottom]:translate-y-1
                            data-[side=left]:-translate-x-1
                            data-[side=right]:translate-x-1
                            data-[side=top]:-translate-y-1
                        `,
                    className,
                )}
                position={position}
            >
                <SelectScrollUpButton />
                <RadixSelect.Viewport
                    className={cn(
                        "p-1",
                        position === "popper" &&
                            oneLine`
                                h-[var(--radix-select-trigger-height)]
                                w-full
                                min-w-[var(--radix-select-trigger-width)]
                            `,
                    )}
                >
                    {children}
                </RadixSelect.Viewport>
                <SelectScrollDownButton />
            </RadixSelect.Content>
        </RadixSelect.Portal>
    );
});

SelectContent.displayName = "SelectContent";
