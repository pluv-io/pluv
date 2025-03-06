import { yjs } from "@pluv/crdt-yjs";
import type { FC } from "react";
import {
    useCanRedo,
    useCanUndo,
    useMyself,
    useOthers,
    useRedo,
    useStorage,
    useTransact,
    useUndo,
} from "../../../pluv-io/yjs/cloudflare";

export type StorageRoomProps = Record<string, never>;

export const StorageRoom: FC<StorageRoomProps> = () => {
    const [messages, sharedType] = useStorage("messages");

    const myself = useMyself((myself) => myself.connectionId);
    const others = useOthers((others) => others.map((other) => other.connectionId));

    const canUndo = useCanUndo();
    const canRedo = useCanRedo();
    const transact = useTransact();

    const undo = useUndo();
    const redo = useRedo();

    return (
        <div id="storage-room">
            <div>Storage Room</div>
            <br />
            <ul>
                <li>Myself: {myself}</li>
                {others.map((other, i) => (
                    <li key={i}>Other: {other}</li>
                ))}
            </ul>
            <br />
            <div>
                <button
                    id="button-add-message"
                    onClick={() => {
                        transact(() => {
                            sharedType?.push([
                                yjs.object({
                                    message: `new message ${messages?.length ?? 0}`,
                                    name: "John Doe",
                                }),
                            ]);
                        });
                    }}
                    type="button"
                >
                    Add Message
                </button>
                <button
                    id="button-undo"
                    onClick={() => {
                        undo();
                    }}
                >
                    Undo
                </button>
                <button
                    id="button-redo"
                    onClick={() => {
                        redo();
                    }}
                >
                    Redo
                </button>
            </div>
            <br />
            <div id="can-undo">Can Undo: {String(canUndo)}</div>
            <br />
            <div id="can-redo">Can Redo: {String(canRedo)}</div>
            <br />
            {messages && (
                <div id="storage" style={{ whiteSpace: "pre" }}>
                    {JSON.stringify(messages, null, 2)}
                </div>
            )}
        </div>
    );
};
