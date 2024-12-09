import type { ComponentProps } from "react";
import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import NextLink from "next/link";
import { forwardRef } from "react";

export type CommandStaticLinkProps = ComponentProps<typeof NextLink>;

export const CommandStaticLink = forwardRef<HTMLAnchorElement, CommandStaticLinkProps>(
    ({ as: _as, className, href, ...props }, ref) => {
        return (
            <NextLink
                ref={ref}
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
                        hover:bg-accent
                        hover:text-accent-foreground
                        disabled:pointer-events-none
                        disabled:opacity-50
                    `,
                    className,
                )}
                as={_as as string}
                href={href as string}
                {...props}
            />
        );
    },
);

CommandStaticLink.displayName = "CommandStaticLink";
