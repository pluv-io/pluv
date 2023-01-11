import { y } from "@pluv/react";
import clsx from "clsx";
import { FC, useEffect, useState } from "react";
import { ChatMessage } from "./ChatMessage";
import { CloudflareCursor } from "./CloudflareCursor";
import { CloudflareUsersList } from "./CloudflareUsersList";
import {
    usePluvBroadcast,
    usePluvMyPresence,
    usePluvMyself,
    usePluvOthers,
    usePluvStorage,
} from "../pluv-io/cloudflare";

export type CloudflareChatRoomProps = Record<string, never>;

export const CloudflareChatRoom: FC<CloudflareChatRoomProps> = () => {
    const [message, setMessage] = useState<string>("");

    const broadcast = usePluvBroadcast();
    const myself = usePluvMyself();
    const [, updatePresence] = usePluvMyPresence(() => true);

    const connectionIds = usePluvOthers((others) =>
        others.map((other) => other.connectionId)
    );

    const [messages, sharedType] = usePluvStorage("messages");

    useEffect(() => {
        const onMouseMove = (event: MouseEvent) => {
            const x = event.pageX;
            const y = event.pageY;

            updatePresence({ cursor: { x, y } });
        };

        window.addEventListener("mousemove", onMouseMove);

        return () => {
            window.removeEventListener("mousemove", onMouseMove);
        };
    }, [updatePresence]);

    if (!myself) return null;

    return (
        <div className={clsx("flex flex-row items-stretch")}>
            {connectionIds.map((connectionId) => (
                <CloudflareCursor
                    key={connectionId}
                    connectionId={connectionId}
                />
            ))}
            <div className={clsx("flex flex-col items-stretch", "w-96")}>
                <div
                    className={clsx(
                        "flex flex-row items-stretch",
                        "h-10",
                        "rounded-tl-md border border-gray-600"
                    )}
                >
                    <input
                        className={clsx(
                            "grow px-2",
                            "rounded-tl-md border-r border-gray-600",
                            "hover:bg-indigo-50 focus:bg-indigo-100"
                        )}
                        onChange={(event) => setMessage(event.target.value)}
                        onKeyDown={(event) => {
                            if (!event.shiftKey) return;
                            if (event.key.toLowerCase() !== "enter") return;

                            broadcast("SEND_MESSAGE", { message });

                            sharedType?.unshift([
                                y.unstable__object({
                                    message,
                                    name: myself.user.name,
                                }),
                            ]);

                            setMessage("");
                        }}
                        type="text"
                        value={message}
                    />
                    <button
                        className={clsx(
                            "rounded-tr-md px-2 text-base font-semibold",
                            "hover:bg-indigo-50 focus:bg-indigo-100"
                        )}
                        onClick={() => {
                            broadcast("SEND_MESSAGE", { message });

                            sharedType?.unshift([
                                y.unstable__object({
                                    message,
                                    name: myself.user.name,
                                }),
                            ]);

                            setMessage("");
                        }}
                        type="button"
                    >
                        Send
                    </button>
                </div>
                {!!messages?.length && (
                    <div
                        className={clsx(
                            "flex flex-col items-stretch gap-y-2",
                            "rounded-bl-md border border-gray-600 p-2"
                        )}
                    >
                        {messages.map((message, i) => (
                            <ChatMessage
                                key={i}
                                message={message.message}
                                name={message.name}
                            />
                        ))}
                    </div>
                )}
            </div>
            <CloudflareUsersList
                className={clsx("rounded-r-md border-gray-600")}
            />
        </div>
    );
};
