import { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import { FC } from "react";

export type CommandShortcutProps = InferComponentProps<"span">;

export const CommandShortcut: FC<CommandShortcutProps> = ({ className, ...props }) => {
    return <span className={cn("ml-auto text-xs tracking-widest text-muted-foreground", className)} {...props} />;
};

CommandShortcut.displayName = "CommandShortcut";
