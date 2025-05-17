import type { InferBundleRoom } from "@pluv/react";
import { createContext } from "react";
import type { XmlFragment as YXmlFragment } from "yjs";
import type { bundle } from "../../../../pluv-io/yjs/cloudflare";

export interface BlockNoteEditorContextValue {
    fragment: YXmlFragment;
    room: InferBundleRoom<typeof bundle>;
}

export const BlockNoteEditorContext = createContext<BlockNoteEditorContextValue>(null as any);
