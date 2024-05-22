import { FC, useCallback, useState } from "react";
import { pluv } from "./pluv";

export const ChatRoom: FC<Record<string, never>> = () => {
    const [messages, setMessages] = useState<readonly string[]>([]);
    const broadcast = pluv.useBroadcast();

    pluv.event.RECEIVE_MESSAGE.useEvent(({ data }) => {
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
