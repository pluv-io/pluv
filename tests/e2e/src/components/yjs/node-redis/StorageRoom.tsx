import { yjs } from "@pluv/crdt-yjs";
import type { FC } from "react";
import {
    useCanRedo,
    useCanUndo,
    useRedo,
    useStorage,
    useTransact,
    useUndo,
} from "../../../pluv-io/yjs/node-redis";

export type StorageRoomProps = Record<string, never>;

export const StorageRoom: FC<StorageRoomProps> = () => {
    const [messages, sharedType] = useStorage("messages");

    const canUndo = useCanUndo();
    const canRedo = useCanRedo();
    const transact = useTransact();

    const undo = useUndo();
    const redo = useRedo();

    return (
        <div id="storage-room">
            <div>Storage Room</div>
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
