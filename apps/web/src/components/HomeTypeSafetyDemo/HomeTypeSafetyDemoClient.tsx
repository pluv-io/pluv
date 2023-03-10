import { PrismCode } from "@pluv-internal/react-code";
import { codeBlock } from "common-tags";
import { CSSProperties, FC, useContext, useMemo } from "react";
import { HomeTypeSafetyDemoContext } from "./context";
import { HomeTypeSafetyDemoClientToken } from "./HomeTypeSafetyDemoClientToken";

const INPUT_PARAMETER = "__INPUT_PARAMETER__";
const NEW_MESSAGE = "__NEW_MESSAGE__";
const SEND_MESSAGE_INPUT = "__SEND_MESSAGE_INPUT__";

export interface HomeTypeSafetyDemoClientProps {
    className?: string;
    style?: CSSProperties;
}

export const HomeTypeSafetyDemoClient: FC<HomeTypeSafetyDemoClientProps> = ({
    className,
    style,
}) => {
    const template = useMemo(
        (): string => codeBlock`
            // client/Room.tsx

            import { usePluvBroadcast, usePluvEvent } from "client/pluv";
            import { FC, useCallback, useState } from "react";

            export const Room: FC = () => {
              const [messages, setMessages] = useState<string[]>([]);

              // Listen to new messages from the server
              // Get types from the SEND_MESSAGE resolver output
              usePluvEvent("MESSAGE_RECEIVED", ({${INPUT_PARAMETER}}) => {
                setMessages((prev) => [...prev${NEW_MESSAGE}]);
              });

              const broadcast = usePluvBroadcast();

              const onSubmit = useCallback((message: string) => {
                // Broadcast to all users
                // Get types from the SEND_MESSAGE zod input
                broadcast("SEND_MESSAGE", {${SEND_MESSAGE_INPUT}});
              }, [broadcast]);

              // return ...
            };
        `,
        []
    );

    const [
        ,
        ,
        ,
        { text: inputParam },
        { text: newMessage },
        { text: sendMessageInput },
    ] = useContext(HomeTypeSafetyDemoContext);

    const code = useMemo(() => {
        return template
            .replace(INPUT_PARAMETER, inputParam)
            .replace(NEW_MESSAGE, newMessage)
            .replace(SEND_MESSAGE_INPUT, sendMessageInput);
    }, [inputParam, newMessage, sendMessageInput, template]);

    return (
        <PrismCode
            className={className}
            style={style}
            language="tsx"
            tokenRenderer={HomeTypeSafetyDemoClientToken}
        >
            {code}
        </PrismCode>
    );
};
