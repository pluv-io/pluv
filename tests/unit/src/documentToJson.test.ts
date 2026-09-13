import { loro } from "@pluv/crdt-loro";
import { yjs } from "@pluv/crdt-yjs";
import { describe, expect, it } from "vitest";

const AUTHORED_CONTENT = "authored app json";

const scenarios = [
    {
        name: "yjs",
        empty: () => yjs.doc().getEmpty(),
        authored: () =>
            yjs
                .storage({
                    schema: yjs.schema({
                        content: yjs.yText(),
                    }),
                })
                .getInitialized({ content: AUTHORED_CONTENT }),
        encoded: () =>
            yjs
                .storage({
                    schema: yjs.schema({
                        content: yjs.yText(),
                    }),
                })
                .getInitialized({ content: AUTHORED_CONTENT })
                .getEncodedState(),
        keyed: (doc: { toJson: (key: "content") => unknown }) => doc.toJson("content"),
    },
    {
        name: "loro",
        empty: () => loro.doc().getEmpty(),
        authored: () =>
            loro
                .storage({
                    schema: loro.schema({
                        content: loro.loroText(),
                    }),
                })
                .getInitialized({ content: AUTHORED_CONTENT }),
        encoded: () =>
            loro
                .storage({
                    schema: loro.schema({
                        content: loro.loroText(),
                    }),
                })
                .getInitialized({ content: AUTHORED_CONTENT })
                .getEncodedState(),
        keyed: (doc: { toJson: (key: "content") => unknown }) => doc.toJson("content"),
    },
] as const;

describe.each(scenarios)("$name toJson", ({ authored, empty, encoded, keyed }) => {
    it("serializes schema-initialized documents from the underlying doc", () => {
        const doc = authored();

        expect(doc.toJson()).toEqual({ content: AUTHORED_CONTENT });
        expect(keyed(doc)).toBe(AUTHORED_CONTENT);
        expect(doc.toJson()).not.toHaveProperty("__$pluv");
    });

    it("serializes an empty factory after applyEncodedState", () => {
        const doc = empty().applyEncodedState({ update: encoded() });

        expect(doc.toJson()).toEqual({ content: AUTHORED_CONTENT });
        expect((doc.toJson() as { content?: string }).content).toBe(AUTHORED_CONTENT);
        expect(doc.toJson()).not.toHaveProperty("__$pluv");
    });
});
