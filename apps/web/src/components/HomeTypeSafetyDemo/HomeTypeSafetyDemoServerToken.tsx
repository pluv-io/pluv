import { CodeTooltip, PrismCodeTokenProps } from "@pluv-internal/react-code";
import { FC, useCallback, useState } from "react";

export type HomeTypeSafetyDemoServerTokenProps = PrismCodeTokenProps;

export const HomeTypeSafetyDemoServerToken: FC<
    HomeTypeSafetyDemoServerTokenProps
> = ({ lineNo, tokenProps }) => {
    const text = tokenProps.children;

    const [open, setOpen] = useState<boolean>(false);

    const showTooltip = useCallback(
        (text: string, toMatch: string): boolean => {
            const trimmed = text.trimStart();

            if (!toMatch.includes(trimmed)) return false;
            if (!trimmed.startsWith(toMatch.charAt(0))) return false;

            return true;
        },
        []
    );

    const fallback = <span {...tokenProps} />;

    if (tokenProps.key !== 6) return fallback;
    if (lineNo !== 16) return fallback;

    const padded = text.startsWith(" ");

    return (
        <CodeTooltip
            helperText="(property) message: string"
            label="message"
            onOpenChange={(newOpen) => {
                setOpen(newOpen);
            }}
            open={showTooltip(text, "message") || open}
        >
            {({ children, handlers, ref }) => (
                <span>
                    {padded && " "}
                    <span ref={ref} {...tokenProps} {...handlers}>
                        {text.trim()}
                        {children}
                    </span>
                    {padded && " "}
                </span>
            )}
        </CodeTooltip>
    );
};
