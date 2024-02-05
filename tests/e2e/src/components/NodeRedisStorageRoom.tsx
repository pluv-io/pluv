import { yjs } from "@pluv/crdt-yjs";
import type { FC } from "react";
import {
    usePluvCanRedo,
    usePluvCanUndo,
    usePluvRedo,
    usePluvStorage,
    usePluvTransact,
    usePluvUndo,
} from "../pluv-io/node-redis";

export type NodeRedisStorageRoomProps = Record<string, never>;

export const NodeRedisStorageRoom: FC<NodeRedisStorageRoomProps> = () => {
    const [messages, sharedType] = usePluvStorage("messages");

    const canUndo = usePluvCanUndo();
    const canRedo = usePluvCanRedo();
    const transact = usePluvTransact();

    const undo = usePluvUndo();
    const redo = usePluvRedo();

    return (
        <div id="storage-room">
            <div>Storage Room</div>
            <br />
            <div>
                <button
                    id="button-add-message"
                    onClick={() => {
                        transact(() => {
                            sharedType.push([
                                yjs.object({
                                    message: `new message ${messages.length}`,
                                    name: "John Doe",
                                }).value,
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
