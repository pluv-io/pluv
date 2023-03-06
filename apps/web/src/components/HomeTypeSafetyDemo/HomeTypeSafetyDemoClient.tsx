import { PrismCode } from "@pluv-internal/react-code";
import { codeBlock } from "common-tags";
import { CSSProperties, FC, useMemo } from "react";

export interface HomeTypeSafetyDemoClientProps {
    className?: string;
    style?: CSSProperties;
}

export const HomeTypeSafetyDemoClient: FC<HomeTypeSafetyDemoClientProps> = ({
    className,
    style,
}) => {
    const code = useMemo(
        (): string => codeBlock`
            import { usePluvBroadcast, usePluvEvent } from "client/pluv";
            import { FC, useCallback, useState } from "react";

            export const Room: FC = () => {
                const [messages, setMessages] = useState<string[]>([]);

                // Listen to new messages from the server
                usePluvEvent("MESSAGE_RECEIVED", ({ data }) => {
                    setMessages((prev) => [...prev, data.message]);
                });

                const broadcast = usePluvBroadcast();

                const onSubmit = useCallback((message: string) => {
                    broadcast("SEND_MESSAGE", { message });
                }, [broadcast]);

                // return ...
            };
        `,
        []
    );

    return (
        <PrismCode className={className} style={style} language="tsx">
            {code}
        </PrismCode>
    );
};
