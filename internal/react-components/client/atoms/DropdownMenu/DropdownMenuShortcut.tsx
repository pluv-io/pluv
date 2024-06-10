import { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import { FC } from "react";

export type DropdownMenuShortcutProps = InferComponentProps<"span">;

export const DropdownMenuShortcut: FC<DropdownMenuShortcutProps> = ({ className, ...props }) => {
    return <span className={cn("ml-auto text-xs tracking-widest opacity-60", className)} {...props} />;
};
