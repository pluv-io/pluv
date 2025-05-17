import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import { yjs } from "@pluv/crdt-yjs";
import type { FC } from "react";
import { useContext, useMemo } from "react";
import { BlockNoteEditorContext } from "./context";
import { getRandomUserProfile } from "./getRandomUserProfile";

export interface BlockNoteEditorInnerProps {
    userName?: string;
}

export const BlockNoteEditorInner: FC<BlockNoteEditorInnerProps> = ({ userName }) => {
    const { fragment, room } = useContext(BlockNoteEditorContext);

    const provider = useMemo(() => yjs.provider({ field: "blocknote", room }), [room]);
    const user = useMemo(
        () => ({ ...getRandomUserProfile(), ...(!!userName ? { name: userName } : {}) }),
        [userName],
    );

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
