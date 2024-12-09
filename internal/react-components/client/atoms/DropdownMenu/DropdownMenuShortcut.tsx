import type { ComponentProps } from "react";
import { cn } from "@pluv-internal/utils";
import { FC } from "react";

export type DropdownMenuShortcutProps = ComponentProps<"span">;

export const DropdownMenuShortcut: FC<DropdownMenuShortcutProps> = ({ className, ...props }) => {
    return <span className={cn("ml-auto text-xs tracking-widest opacity-60", className)} {...props} />;
};
