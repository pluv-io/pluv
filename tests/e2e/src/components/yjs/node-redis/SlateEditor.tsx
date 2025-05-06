import { withYjs, YjsEditor } from "@slate-yjs/core";
import type { FC } from "react";
import { useEffect, useMemo, useState } from "react";
import type { Descendant, Node } from "slate";
import { createEditor, Editor, Transforms } from "slate";
import { Editable, Slate, withReact } from "slate-react";
import { useStorage } from "../../../pluv-io/yjs/node-redis";

export interface SlateEditorProps {}

export const SlateEditor: FC<SlateEditorProps> = () => {
    const [content, sharedType] = useStorage("slate");

    const editor = useMemo(() => {
        if (!sharedType) return null;

        const e = withReact(withYjs(createEditor(), sharedType));
        const { normalizeNode } = e;

        e.normalizeNode = (entry) => {
            const [node] = entry;

            if (!Editor.isEditor(node) || node.children.length > 0) {
                return normalizeNode(entry);
            }

            Transforms.insertNodes(
                e,
                {
                    type: "paragraph",
                    children: [{ text: "" }],
                } as Node,
                { at: [0] },
            );
        };

        return e;
    }, [sharedType]);

    useEffect(() => {
        if (!editor) return;

        YjsEditor.connect(editor);

        return () => {
            YjsEditor.disconnect(editor);
        };
    }, [editor]);

    const [value, setValue] = useState<Descendant[]>([]);

    if (!editor) return null;

    return (
        <Slate
            editor={editor}
            initialValue={value}
            onChange={(newValue) => {
                setValue(newValue);
            }}
        >
            <Editable
                id="slate-editable"
                style={{
                    minHeight: 540,
                    border: "1px solid black",
                    borderRadius: 4,
                }}
            />
        </Slate>
    );
};
