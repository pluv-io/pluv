import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import type { CSSProperties, FC, ReactElement, ReactNode, RefCallback } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { usePopper } from "react-popper";
import type { CodeTooltipIconType } from "./CodeTooltipIcon";
import { CodeTooltipIcon } from "./CodeTooltipIcon";

export interface CodeTooltipChildProps {
    children: ReactNode;
    handlers: {
        onMouseOut: () => void;
        onMouseOver: () => void;
    };
    ref: RefCallback<HTMLElement>;
}

export interface CodeTooltipProps {
    children: (props: CodeTooltipChildProps) => ReactElement;
    className?: string;
    helperText?: string;
    label: string;
    onOpenChange?: (open: boolean) => void;
    open?: boolean;
    style?: CSSProperties;
    type?: CodeTooltipIconType;
}

export const CodeTooltip: FC<CodeTooltipProps> = ({
    children,
    className,
    helperText,
    label,
    onOpenChange,
    open,
    style,
    type = "field",
}) => {
    const [refElem, refRef] = useState<HTMLElement | null>(null);
    const [popperElem, popperRef] = useState<HTMLDivElement | null>(null);

    const { attributes, forceUpdate, styles } = usePopper(refElem, popperElem, {
        placement: "bottom-end",
        strategy: "fixed",
        modifiers: useMemo(
            () => [
                {
                    name: "computeStyles",
                    options: {
                        gpuAcceleration: false,
                    },
                },
            ],
            [],
        ),
    });

    const onMouseOver = useCallback(() => {
        onOpenChange?.(true);
    }, [onOpenChange]);

    const onMouseOut = useCallback(() => {
        onOpenChange?.(false);
    }, [onOpenChange]);

    useEffect(() => {
        forceUpdate?.();
    }, [children, forceUpdate]);

    return children({
        ref: refRef,
        children:
            !!open &&
            typeof window !== "undefined" &&
            createPortal(
                <div
                    ref={popperRef}
                    className={cn(
                        oneLine`
                            z-[1]
                            hidden
                            flex-row
                            items-center
                            gap-1
                            whitespace-nowrap
                            rounded-sm
                            border
                            border-solid
                            border-indigo-700/60
                            bg-zinc-800
                            px-1.5
                            py-0.5
                            text-sm
                            shadow-md
                            shadow-indigo-800
                            md:flex
                            md:translate-x-full
                    `,
                        className,
                    )}
                    style={{ ...styles.popper, ...style }}
                    {...attributes.popper}
                >
                    <CodeTooltipIcon height={16} type={type} width={16} />
                    <span className="font-medium">{label}</span>
                    {!!helperText && <span className="ml-9 text-gray-400">{helperText}</span>}
                </div>,
                document.body,
            ),
        handlers: { onMouseOut, onMouseOver },
    });
};
