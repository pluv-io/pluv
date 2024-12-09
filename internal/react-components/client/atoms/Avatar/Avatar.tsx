import type { ComponentProps } from "react";
import { cn } from "@pluv-internal/utils";
import * as RadixAvatar from "@radix-ui/react-avatar";
import { oneLine } from "common-tags";
import type { ElementRef } from "react";
import { forwardRef } from "react";

export type AvatarProps = ComponentProps<typeof RadixAvatar.Root>;

export const Avatar = forwardRef<ElementRef<typeof RadixAvatar.Root>, AvatarProps>(({ className, ...props }, ref) => {
    return (
        <RadixAvatar.Root
            ref={ref}
            className={cn(
                oneLine`
                    relative
                    flex
                    size-10
                    shrink-0
                    overflow-hidden
                    rounded-full
                    border
                    border-muted-foreground
                `,
                className,
            )}
            {...props}
        />
    );
});

Avatar.displayName = "Avatar";
