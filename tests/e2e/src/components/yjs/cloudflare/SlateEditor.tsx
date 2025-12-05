import { yjs } from "@pluv/crdt-yjs";
import { withCursors, withYjs, YjsEditor } from "@slate-yjs/core";
import type { FC } from "react";
import { useEffect, useMemo, useState } from "react";
import type { Descendant } from "slate";
import { createEditor, Editor, Transforms } from "slate";
import { Editable, Slate, withReact } from "slate-react";
import { useRoom, useStorage } from "../../../pluv-io/yjs/cloudflare";

const INITIAL_VALUE: Descendant = {
    children: [{ text: "" }],
};

export interface SlateEditorProps {}

type SharedType = NonNullable<ReturnType<typeof useStorage<"slate">>[1]>;
type Provider = ReturnType<typeof yjs.provider>;

interface SlateEditableProps {
    provider: Provider;
    sharedType: SharedType;
}

const SlateEditable: FC<SlateEditableProps> = ({ provider, sharedType }) => {
    const editor = useMemo(() => {
        const e = withCursors(
            withReact(withYjs(createEditor(), sharedType)),
            provider.awareness as any,
            { data: { name: "John Doe", color: "#00ff00" } },
        );
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
    const room = useRoom();
    const [provider, setProvider] = useState<Provider | null>(null);
    const [connected, setConnected] = useState<boolean>(false);

    useEffect(() => {
        if (!sharedType || !room) return;

        const yProvider = yjs.provider({ room });

        setProvider(yProvider as any);
        yProvider.on("sync", setConnected);

        return () => {
            yProvider.off("sync", setConnected);
            yProvider.destroy();
        };
    }, [sharedType, room]);

    if (!connected || !provider || !sharedType) return null;

    return <SlateEditable provider={provider} sharedType={sharedType} />;
};
