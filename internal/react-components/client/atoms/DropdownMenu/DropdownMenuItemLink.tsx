import type { ComponentProps } from "react";
import { cn } from "@pluv-internal/utils";
import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu";
import { oneLine } from "common-tags";
import NextLink from "next/link";
import type { HTMLAttributeAnchorTarget, ReactNode } from "react";
import { forwardRef } from "react";

export type DropdownMenuItemLinkProps = Pick<ComponentProps<typeof RadixDropdownMenu.Item>, "onSelect"> & {
    children?: ReactNode;
    className?: string;
    disabled?: boolean;
    href: string;
    inset?: boolean;
    rel?: string;
    target?: HTMLAttributeAnchorTarget;
};

export const DropdownMenuItemLink = forwardRef<HTMLAnchorElement, DropdownMenuItemLinkProps>(
    ({ children, className, disabled, href, inset, onSelect, rel, target }, ref) => {
        return (
            <RadixDropdownMenu.Item asChild disabled={disabled} onSelect={onSelect}>
                <NextLink
                    ref={ref}
                    className={cn(
                        oneLine`
                            relative
                            flex
                            cursor-pointer
                            select-none
                            items-center
                            gap-y-1.5
                            rounded-sm
                            px-2
                            py-1.5
                            text-sm
                            outline-none
                            transition-colors
                            focus:bg-accent
                            focus:text-accent-foreground
                            data-[disabled]:pointer-events-none
                            data-[disabled]:opacity-50
                        `,
                        inset && "pl-8",
                        className,
                    )}
                    href={href}
                    rel={rel}
                    target={target}
                >
                    {children}
                </NextLink>
            </RadixDropdownMenu.Item>
        );
    },
);

DropdownMenuItemLink.displayName = "DropdownMenuItemLink";
