import type { ComponentProps } from "react";
import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import { forwardRef } from "react";

export type CommandStaticGroupProps = ComponentProps<"div">;

export const CommandStaticGroup = forwardRef<HTMLDivElement, CommandStaticGroupProps>(
    ({ className, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    oneLine`
                    flex
                    flex-col
                    items-stretch
                    overflow-hidden
                    p-1
                    text-foreground
                `,
                    className,
                )}
                {...props}
            />
        );
    },
);

CommandStaticGroup.displayName = "CommandStaticGroup";
