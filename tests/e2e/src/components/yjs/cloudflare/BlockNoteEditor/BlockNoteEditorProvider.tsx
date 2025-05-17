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
    const room = useRoom();
    const [, fragment] = useStorage("blocknote", () => true);

    const value = useMemo(() => (!!fragment ? { fragment, room } : null), [fragment, room]);

    if (state !== ConnectionState.Open) return null;
    if (!value) return null;

    return (
        <BlockNoteEditorContext.Provider value={value}>{children}</BlockNoteEditorContext.Provider>
    );
};
