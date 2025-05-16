import type { FC } from "react";
import { BlockNoteEditorInner } from "./BlockNoteEditorInner";
import { BlockNoteEditorProvider } from "./BlockNoteEditorProvider";

export interface BlockNoteEditorProps {}

export const BlockNoteEditor: FC<BlockNoteEditorProps> = () => {
    return (
        <BlockNoteEditorProvider>
            <BlockNoteEditorInner />
        </BlockNoteEditorProvider>
    );
};
