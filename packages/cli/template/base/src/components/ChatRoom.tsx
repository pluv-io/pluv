import { y } from "@pluv/react";
import { FC, useState } from "react";
import { PluvRoom } from "../pluv-io";

export const ChatRoom: FC<Record<string, never>> = () => {
    const [message, setMessage] = useState<string>("");

    const [, updatePresence] = PluvRoom.usePluvMyPresence(() => true);
    const myself = PluvRoom.usePluvMyself();
    const others = PluvRoom.usePluvOthers();
    const [messages, sharedType] = PluvRoom.usePluvStorage("messages");

    if (!myself) return null;

    return (
        <div>
            <button
                onClick={() => {
                    updatePresence({
                        count: myself.presence.count + 1
                    });
                }}
                type="button"
            >
                Increment
            </button>
            <div>
                <div>{myself.user.name}: {myself.presence.count}</div>
                {others.map((other) => (
                    <div key={other.connectionId}>
                        {other.user?.name}: {other.presence.count}
                    </div>
                ))}
            </div>
            <div>
                {messages?.map((message, i) => (
                    <div key={i}>{message.name}: {message.message}</div>
                ))}
            </div>
            <input
                onChange={(e) => {
                    setMessage(e.target.value)
                }}
                onKeyDown={(e) => {
                    if (!e.shiftKey) return;
                    if (e.key.toLowerCase() !== "enter") return;

                    sharedType?.push([
                        y.unstable__object({
                            message,
                            name: myself.user.name,
                        })
                    ]);

                    setMessage("");
                }}
                type="text"
                value={message}
            />
        </div>
    );
};
