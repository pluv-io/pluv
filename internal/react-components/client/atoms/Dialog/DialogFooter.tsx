import { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import { FC } from "react";

export type DialogFooterProps = InferComponentProps<"div">;

export const DialogFooter: FC<DialogFooterProps> = ({ className, ...props }) => (
    <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
);

DialogFooter.displayName = "DialogFooter";
