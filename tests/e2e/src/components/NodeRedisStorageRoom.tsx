import { y } from "@pluv/react";
import type { FC } from "react";
import { usePluvStorage } from "../pluv-io/node-redis";

export type NodeRedisStorageRoomProps = Record<string, never>;

export const NodeRedisStorageRoom: FC<NodeRedisStorageRoomProps> = () => {
    const [messages, sharedType] = usePluvStorage("messages");

    return (
        <div id="storage-room">
            <div>Storage Room</div>
            <br />
            <button
                id="button-add-message"
                onClick={() => {
                    sharedType?.push([
                        y.object({
                            message: `new message ${messages?.length ?? 0}`,
                            name: "John Doe",
                        }),
                    ]);
                }}
                type="button"
            >
                Add Message
            </button>
            <br />
            {messages && (
                <div id="storage" style={{ whiteSpace: "pre" }}>
                    {JSON.stringify(messages, null, 2)}
                </div>
            )}
        </div>
    );
};
