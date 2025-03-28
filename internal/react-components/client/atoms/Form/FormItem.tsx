import type { ComponentProps } from "react";
import { cn } from "@pluv-internal/utils";
import { forwardRef, useId } from "react";
import { FormItemContext } from "./FormItemContext";

export type FormItemProps = ComponentProps<"div">;

export const FormItem = forwardRef<HTMLDivElement, FormItemProps>(({ className, ...props }, ref) => {
    const id = useId();

    return (
        <FormItemContext.Provider value={{ id }}>
            <div ref={ref} className={cn("space-y-1.5", className)} {...props} />
        </FormItemContext.Provider>
    );
});
FormItem.displayName = "FormItem";
