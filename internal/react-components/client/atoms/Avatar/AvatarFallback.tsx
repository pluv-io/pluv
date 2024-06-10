import { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import * as RadixAvatar from "@radix-ui/react-avatar";
import { ElementRef, forwardRef } from "react";

export type AvatarFallbackProps = InferComponentProps<typeof RadixAvatar.Fallback>;

export const AvatarFallback = forwardRef<ElementRef<typeof RadixAvatar.Fallback>, AvatarFallbackProps>(
    ({ className, ...props }, ref) => {
        return (
            <RadixAvatar.Fallback
                ref={ref}
                className={cn("flex size-full items-center justify-center rounded-full bg-muted", className)}
                {...props}
            />
        );
    },
);

AvatarFallback.displayName = "AvatarFallback";
