import { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import { FC } from "react";

export type DialogHeaderProps = InferComponentProps<"div">;

export const DialogHeader: FC<DialogHeaderProps> = ({ className, ...props }) => (
    <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
);

DialogHeader.displayName = "DialogHeader";
