import type { FC } from "react";
import { BlockNoteEditorInner } from "./BlockNoteEditorInner";
import { BlockNoteEditorProvider } from "./BlockNoteEditorProvider";

export interface BlockNoteEditorProps {
    userName?: string;
}

export const BlockNoteEditor: FC<BlockNoteEditorProps> = ({ userName }) => {
    return (
        <BlockNoteEditorProvider>
            <BlockNoteEditorInner />
        </BlockNoteEditorProvider>
    );
};
