import { withYjs, YjsEditor } from "@slate-yjs/core";
import type { FC } from "react";
import { useEffect, useMemo } from "react";
import type { Descendant } from "slate";
import { createEditor, Editor, Transforms } from "slate";
import { Editable, Slate, withReact } from "slate-react";
import { useStorage } from "../../../pluv-io/yjs/cloudflare";

const INITIAL_VALUE: Descendant = {
    children: [{ text: "" }],
};

export interface SlateEditorProps {}

type SharedType = NonNullable<ReturnType<typeof useStorage<"slate">>[1]>;

const SlateEditable: FC<{ sharedType: SharedType }> = ({ sharedType }) => {
    const editor = useMemo(() => {
        const e = withReact(withYjs(createEditor(), sharedType));
        const { normalizeNode } = e;

        e.normalizeNode = (entry, options) => {
            const [node] = entry;

            if (!Editor.isEditor(node) || node.children.length > 0) {
                return normalizeNode(entry, options);
            }

            Transforms.insertNodes(e, INITIAL_VALUE, { at: [0] });
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

    return (
        <Slate editor={editor} initialValue={[INITIAL_VALUE]}>
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

export const SlateEditor: FC<SlateEditorProps> = () => {
    const [, sharedType] = useStorage("slate");

    if (!sharedType) return null;

    return <SlateEditable sharedType={sharedType} />;
};
