import type { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import * as RadixAvatar from "@radix-ui/react-avatar";
import NextImage from "next/image";
import type { ElementRef } from "react";
import { forwardRef } from "react";

export type AvatarGitHubImageProps = InferComponentProps<typeof RadixAvatar.Image> & {
    alt: string;
    priority?: boolean;
    src: string;
};

export const AvatarGitHubImage = forwardRef<ElementRef<typeof RadixAvatar.Image>, AvatarGitHubImageProps>(
    ({ alt, className, priority, src, ...props }, ref) => {
        return (
            <RadixAvatar.Image asChild src={src}>
                <NextImage
                    alt={alt}
                    className={cn("aspect-square size-full", className)}
                    height={36}
                    loader={({ src, width }) => {
                        const url = new URL(src);

                        url.searchParams.set("s", width.toString());

                        return url.toString();
                    }}
                    priority={priority}
                    src={src}
                    title={alt}
                    width={36}
                    {...(props as any)}
                    ref={ref}
                />
            </RadixAvatar.Image>
        );
    },
);

AvatarGitHubImage.displayName = "AvatarGitHubImage";
