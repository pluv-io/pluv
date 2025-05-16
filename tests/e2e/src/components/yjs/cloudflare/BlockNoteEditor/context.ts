import type { InferBundleRoom } from "@pluv/react";
import { createContext } from "react";
import type { Doc as YDoc, XmlFragment as YXmlFragment } from "yjs";
import type { bundle } from "../../../../pluv-io/yjs/cloudflare";

export interface BlockNoteEditorContextValue {
    doc: YDoc;
    fragment: YXmlFragment;
    room: InferBundleRoom<typeof bundle>;
}

export const BlockNoteEditorContext = createContext<BlockNoteEditorContextValue>(null as any);
