import { CodeTooltip, PrismCodeTokenProps } from "@pluv-internal/react-code";
import { memo, useCallback, useState } from "react";

export type HomeTypeSafetyDemoServerTokenProps = PrismCodeTokenProps;

export const HomeTypeSafetyDemoServerToken =
    memo<HomeTypeSafetyDemoServerTokenProps>(({ lineNo, tokenProps }) => {
        const text = tokenProps.children;

        const [open, setOpen] = useState<boolean>(false);

        const showTooltip = useCallback(
            (text: string, toMatch: string): boolean => {
                const trimmed = text.trimStart();

                if (!trimmed.startsWith(toMatch.charAt(0))) return false;

                return toMatch.includes(trimmed) || open;
            },
            [open],
        );

        const padded = text.startsWith(" ");

        if (tokenProps.key === 6 && lineNo === 13) {
            return (
                <CodeTooltip
                    helperText="(property) color: string"
                    label="color"
                    onOpenChange={(newOpen) => {
                        setOpen(newOpen);
                    }}
                    open={showTooltip(text, "color")}
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
        }

        if (tokenProps.key === 5 && lineNo === 14) {
            return (
                <CodeTooltip
                    helperText="(property) color: string"
                    label="color"
                    onOpenChange={(newOpen) => {
                        setOpen(newOpen);
                    }}
                    open={showTooltip(text, "color")}
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
        }

        if (tokenProps.key === 6 && lineNo === 21) {
            return (
                <CodeTooltip
                    helperText="(property) message: string"
                    label="message"
                    onOpenChange={(newOpen) => {
                        setOpen(newOpen);
                    }}
                    open={showTooltip(text, "message")}
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
        }

        if (tokenProps.key === 5 && lineNo === 22) {
            return (
                <CodeTooltip
                    helperText="(property) message: string"
                    label="message"
                    onOpenChange={(newOpen) => {
                        setOpen(newOpen);
                    }}
                    open={open && text.trim().startsWith("m")}
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
        }

        return <span {...tokenProps} />;
    });

HomeTypeSafetyDemoServerToken.displayName = "HomeTypeSafetyDemoServerToken";
