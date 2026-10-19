import { yjs } from "@pluv/crdt-yjs";
import type { FC } from "react";
import { useState } from "react";
import {
    event,
    useBroadcast,
    useConnection,
    useMyPresence,
    useOthers,
    useStorageField,
    useTransact,
} from "../../../pluv-io/yjs/platform";

export const PlatformRoom: FC = () => {
    const [heard, setHeard] = useState<string>("");
    const [heardSlow, setHeardSlow] = useState<string>("");
    const connectionId = useConnection((connection) => connection.id);
    const [myPresence, updateMyPresence] = useMyPresence();
    const others = useOthers();
    const broadcast = useBroadcast();
    const [messages, sharedType] = useStorageField("messages");
    const transact = useTransact();

    event.RECEIVE_MESSAGE.useEvent(({ data }) => {
        setHeard(data.message);
    });
    event.RECEIVE_SLOW_MESSAGE.useEvent(({ data }) => {
        setHeardSlow(data.message);
    });

    return (
        <div id="platform-room">
            <div>Platform Room</div>
            {!!connectionId && <div id="connection-id">{connectionId}</div>}
            <button
                id="button-broadcast"
                onClick={() => {
                    void broadcast.SEND_MESSAGE({ message: "ping" });
                }}
                type="button"
            >
                Broadcast
            </button>
            <div id="heard">{heard}</div>
            <button
                id="button-broadcast-slow"
                onClick={() => {
                    void broadcast.SEND_SLOW_MESSAGE({ message: "later" });
                }}
                type="button"
            >
                Broadcast later
            </button>
            <div id="heard-slow">{heardSlow}</div>
            <button
                id="button-increment-count"
                onClick={() => {
                    updateMyPresence({ count: (myPresence?.count ?? 0) + 1 });
                }}
                type="button"
            >
                Increment
            </button>
            <div id="my-presence">{JSON.stringify(myPresence)}</div>
            <div id="others">{JSON.stringify(others)}</div>
            <button
                id="button-add-message"
                onClick={() => {
                    transact(() => {
                        sharedType?.push([
                            yjs.map([
                                ["message", `new message ${messages?.length ?? 0}`],
                                ["name", "John Doe"],
                            ]),
                        ]);
                    });
                }}
                type="button"
            >
                Add Message
            </button>
            {messages && <div id="storage">{JSON.stringify(messages)}</div>}
        </div>
    );
};
