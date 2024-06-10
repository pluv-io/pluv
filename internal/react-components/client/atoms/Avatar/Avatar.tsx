import { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import * as RadixAvatar from "@radix-ui/react-avatar";
import { ElementRef, forwardRef } from "react";

export type AvatarProps = InferComponentProps<typeof RadixAvatar.Root>;

export const Avatar = forwardRef<ElementRef<typeof RadixAvatar.Root>, AvatarProps>(({ className, ...props }, ref) => {
    return (
        <RadixAvatar.Root
            ref={ref}
            className={cn("relative flex size-10 shrink-0 overflow-hidden rounded-full", className)}
            {...props}
        />
    );
});

Avatar.displayName = "Avatar";
