import { FC, useCallback, useState } from "react";
import { useBroadcast, useEvent } from "./pluv";

export const ChatRoom: FC<Record<string, never>> = () => {
    const [messages, setMessages] = useState<readonly string[]>([]);
    const broadcast = useBroadcast();

    useEvent("RECEIVE_MESSAGE", ({ data }) => {
        setMessages((oldMessages) => [...oldMessages, data.message]);
    });

    const onMessage = useCallback(
        (message: string) => {
            broadcast("SEND_MESSAGE", { message });
        },
        [broadcast],
    );

    return <div>{/* ... */}</div>;
};
