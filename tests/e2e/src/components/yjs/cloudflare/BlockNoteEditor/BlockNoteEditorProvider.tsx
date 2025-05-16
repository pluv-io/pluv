import { ConnectionState } from "@pluv/types";
import type { FC, ReactNode } from "react";
import { useMemo } from "react";
import { useConnection, useDoc, useRoom, useStorage } from "../../../../pluv-io/yjs/cloudflare";
import { BlockNoteEditorContext } from "./context";

export interface BlockNoteEditorProviderProps {
    children?: ReactNode;
}

export const BlockNoteEditorProvider: FC<BlockNoteEditorProviderProps> = ({ children }) => {
    const state = useConnection((connection) => connection.state);
    const doc = useDoc().value;
    const room = useRoom();
    const [, fragment] = useStorage("blocknote", () => true);

    const value = useMemo(
        () => (!!fragment ? { doc, fragment, room } : null),
        [doc, fragment, room],
    );

    if (state !== ConnectionState.Open) return null;
    if (!value) return null;

    return (
        <BlockNoteEditorContext.Provider value={value}>{children}</BlockNoteEditorContext.Provider>
    );
};
