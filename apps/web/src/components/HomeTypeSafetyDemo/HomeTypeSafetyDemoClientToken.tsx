import { CodeTooltip, PrismCodeTokenProps } from "@pluv-internal/react-code";
import { memo, useCallback, useState } from "react";

export type HomeTypeSafetyDemoClientTokenProps = PrismCodeTokenProps;

export const HomeTypeSafetyDemoClientToken =
    memo<HomeTypeSafetyDemoClientTokenProps>(({ lineNo, tokenProps }) => {
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

        if (tokenProps.key === 8 && lineNo === 11) {
            return (
                <CodeTooltip
                    helperText="(property) data: { message: string }"
                    label="data"
                    onOpenChange={(newOpen) => {
                        setOpen(newOpen);
                    }}
                    open={showTooltip(text, "data")}
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

        if (tokenProps.key === 13 && lineNo === 12) {
            return (
                <CodeTooltip
                    helperText="(property) data: { message: string }"
                    label="data"
                    onOpenChange={(newOpen) => {
                        setOpen(newOpen);
                    }}
                    open={showTooltip(text, "data")}
                >
                    {({ children, handlers, ref }) => (
                        <span>
                            {padded && " "}
                            <span ref={ref} {...tokenProps} {...handlers}>
                                {text.trim()}
                                {children}
                            </span>
                        </span>
                    )}
                </CodeTooltip>
            );
        }

        if (tokenProps.key === 15 && lineNo === 12) {
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

        if (tokenProps.key === 7 && lineNo === 20) {
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

        return <span {...tokenProps} />;
    });

HomeTypeSafetyDemoClientToken.displayName = "HomeTypeSafetyDemoClientToken";
