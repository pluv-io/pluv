import { CircleLoaderIcon } from "@pluv-internal/react-icons";
import { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import { forwardRef } from "react";

export type SpinnerProps = Omit<InferComponentProps<"svg">, "height" | "width"> & {
    height?: number;
    width?: number;
};

export const Spinner = forwardRef<SVGSVGElement, SpinnerProps>((props, ref) => {
    const { className, height = 24, width = 24 } = props;

    return (
        <CircleLoaderIcon
            className={cn("animate-spin text-inherit opacity-80", className)}
            viewBox="0 0 24 24"
            width={width}
            height={height}
            ref={ref}
            {...props}
        />
    );
});

Spinner.displayName = "Spinner";
