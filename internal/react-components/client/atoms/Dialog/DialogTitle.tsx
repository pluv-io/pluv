import { cn } from "@pluv-internal/utils";
import * as RadixDialog from "@radix-ui/react-dialog";
import { ComponentPropsWithoutRef, ElementRef, forwardRef } from "react";

export type DialogTitleProps = ComponentPropsWithoutRef<typeof RadixDialog.Title>;

export const DialogTitle = forwardRef<ElementRef<typeof RadixDialog.Title>, DialogTitleProps>(
    ({ className, ...props }, ref) => (
        <RadixDialog.Title
            ref={ref}
            className={cn("text-lg font-semibold leading-none tracking-tight", className)}
            {...props}
        />
    ),
);

DialogTitle.displayName = RadixDialog.Title.displayName;
