import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import { yjs } from "@pluv/crdt-yjs";
import type { FC } from "react";
import { useContext, useMemo } from "react";
import { BlockNoteEditorContext } from "./context";
import { getRandomUserProfile } from "./getRandomUserProfile";

export interface BlockNoteEditorInnerProps {}

export const BlockNoteEditorInner: FC<BlockNoteEditorInnerProps> = () => {
    const { doc, fragment, room } = useContext(BlockNoteEditorContext);

    const provider = useMemo(() => yjs.provider({ doc, field: "blocknote", room }), [doc, room]);
    const user = useMemo(() => getRandomUserProfile(), []);

    const editor = useCreateBlockNote({
        collaboration: {
            provider,
            fragment,
            user,
            showCursorLabels: "activity",
        },
    });

    return <BlockNoteView id="blocknote-editable" editor={editor} />;
};
