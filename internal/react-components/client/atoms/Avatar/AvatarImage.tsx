import type { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import * as RadixAvatar from "@radix-ui/react-avatar";
import type { ElementRef } from "react";
import { forwardRef } from "react";

export type AvatarImageProps = InferComponentProps<typeof RadixAvatar.Image>;

export const AvatarImage = forwardRef<ElementRef<typeof RadixAvatar.Image>, AvatarImageProps>(
    ({ className, ...props }, ref) => {
        return <RadixAvatar.Image ref={ref} className={cn("aspect-square size-full", className)} {...props} />;
    },
);

AvatarImage.displayName = "AvatarImage";
