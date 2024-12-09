import type { ComponentProps } from "react";
import { forwardRef } from "react";

export type HiddenInputProps = ComponentProps<"input">;

export const HiddenInput = forwardRef<HTMLInputElement, HiddenInputProps>((props, ref) => {
    return <input type="hidden" {...props} ref={ref} />;
});

HiddenInput.displayName = "HiddenInput";
