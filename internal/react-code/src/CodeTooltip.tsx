import {
    CSSProperties,
    FC,
    ReactElement,
    ReactNode,
    RefCallback,
    useCallback,
    useEffect,
    useState,
} from "react";
import { createPortal } from "react-dom";
import { usePopper } from "react-popper";
import tw from "twin.macro";
import { CodeTooltipIcon, CodeTooltipIconType } from "./CodeTooltipIcon";

const Content = tw.div`
    translate-x-full
    flex
    flex-row
    items-center
    gap-1
    px-1.5
    py-0.5
    border
    border-solid
    border-indigo-700/60
    rounded-sm
    shadow-md
    shadow-indigo-800
    bg-zinc-800
    text-sm
    z-[1]
`;

const Label = tw.span`
    font-medium
`;

const HelperText = tw.span`
    ml-9
    text-gray-400
`;

export interface CodeTooltipChildProps {
    children: ReactNode;
    handlers: {
        onMouseOut: () => void;
        onMouseOver: () => void;
    };
    ref: RefCallback<HTMLElement>;
    style: CSSProperties;
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
        modifiers: [
            {
                name: "computeStyles",
                options: {
                    gpuAcceleration: false,
                },
            },
        ],
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
                <Content
                    ref={popperRef}
                    className={className}
                    style={{
                        ...styles.popper,
                        ...style,
                    }}
                    {...attributes.popper}
                >
                    <CodeTooltipIcon height={16} type={type} width={16} />
                    <Label>{label}</Label>
                    {!!helperText && <HelperText>{helperText}</HelperText>}
                </Content>,
                document.body
            ),
        handlers: { onMouseOut, onMouseOver },
        style: { position: "relative" },
    });
};
