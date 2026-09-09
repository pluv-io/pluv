import { loro } from "@pluv/crdt-loro";
import { yjs } from "@pluv/crdt-yjs";
import { describe, expect, it } from "vitest";

const AUTHORED_CONTENT = "content that the user will delete";

/**
 * @description `roomDoc` mirrors how `IORoom` builds its document: no storage keys, hydrated
 * entirely from an encoded state. Scenarios return encoded states so the shared assertions
 * below stay free of CRDT-specific types.
 */
const scenarios = [
    {
        name: "yjs",
        roomDoc: () => yjs.doc(() => ({})).getEmpty(),
        authoredState: () =>
            yjs
                .doc((t) => ({ content: t.text("content", AUTHORED_CONTENT) }))
                .getInitialized()
                .getEncodedState(),
        deletedState: () => {
            const doc = yjs
                .doc((t) => ({ content: t.text("content", AUTHORED_CONTENT) }))
                .getInitialized();
            const text = doc.get("content");

            text.delete(0, text.length);

            return doc.getEncodedState();
        },
    },
    {
        name: "loro",
        roomDoc: () => loro.doc(() => ({})).getEmpty(),
        authoredState: () =>
            loro
                .doc((t) => ({ content: t.text("content", AUTHORED_CONTENT) }))
                .getInitialized()
                .getEncodedState(),
        deletedState: () => {
            const doc = loro
                .doc((t) => ({ content: t.text("content", AUTHORED_CONTENT) }))
                .getInitialized();
            const text = doc.get("content");

            text.delete(0, text.length);

            return doc.getEncodedState();
        },
    },
] as const;

// Teardown skips persisting an unwritten document, which is only safe while "never written
// to" and "the user deleted everything" stay distinguishable for every CRDT pluv supports.
describe.each(scenarios)("$name document dirtiness", ({ authoredState, deletedState, roomDoc }) => {
    it("reports a document that has never been written to as clean", () => {
        expect(roomDoc().isDirty()).toBe(false);
    });

    it("stays clean when an empty encoded state is applied", () => {
        const update = roomDoc().getEncodedState();

        expect(roomDoc().applyEncodedState({ update }).isDirty()).toBe(false);
    });

    it("reports a document hydrated with content as dirty", () => {
        expect(roomDoc().applyEncodedState({ update: authoredState() }).isDirty()).toBe(true);
    });

    it("still reports a document as dirty after all of its content is deleted", () => {
        expect(roomDoc().applyEncodedState({ update: deletedState() }).isDirty()).toBe(true);
    });
});

describe("yjs isDirty vs isEmpty", () => {
    // Why teardown cannot key off `isEmpty()`: binding an editor to a shared type registers it
    // without writing anything, which is what BlockNote does before the user types.
    it("treats a registered but unwritten shared type as clean, where isEmpty does not", () => {
        const doc = yjs.doc(() => ({})).getEmpty();

        doc.value.getText("content");

        expect(doc.isEmpty()).toBe(false);
        expect(doc.isDirty()).toBe(false);
        expect(doc.getEncodedState()).toBe("AAA=");
    });
});
