import { CrdtSchemaError, s } from "@pluv/crdt";
import { Array as YArray, Map as YMap, Text as YText } from "yjs";
import { describe, expect, it } from "vitest";
import { schema, yArray, yMap, yText, yXmlText } from "./index";

describe("yjs schema hydrate", () => {
    it("inserts JSON leaves into yArray", () => {
        const doc = schema({
            groceries: yArray(s.string()),
        }).getInitialized({
            groceries: ["milk", "eggs"],
        });

        expect(doc.get("groceries")).toBeInstanceOf(YArray);
        expect(doc.get("groceries").toArray()).toEqual(["milk", "eggs"]);
        expect(typeof doc.get("groceries").get(0)).toBe("string");
        expect(doc.toJson()).toEqual({ groceries: ["milk", "eggs"] });
    });

    it("wraps nested CRDT nodes instead of inserting JSON objects", () => {
        const doc = schema({
            chats: yMap(yText()),
            messages: yArray(yMap(s.string())),
        }).getInitialized({
            chats: { note: "hi" },
            messages: [{ message: "hello", name: "ada" }],
        });

        const note = doc.get("chats").get("note");
        const message = doc.get("messages").get(0);

        expect(note).toBeInstanceOf(YText);
        expect(note instanceof YText ? note.toJSON() : undefined).toBe("hi");
        expect(message).toBeInstanceOf(YMap);
        expect(message instanceof YMap ? message.get("message") : undefined).toBe("hello");
        expect(doc.toJson()).toEqual({
            chats: { note: "hi" },
            messages: [{ message: "hello", name: "ada" }],
        });
    });

    it("hydrates $union with first-match on seed", () => {
        const doc = schema({
            mixed: yArray(s.$union([s.string(), yMap(s.number())])),
        }).getInitialized({
            mixed: ["hello", { n: 1 }],
        });

        expect(doc.get("mixed").get(0)).toBe("hello");
        const second = doc.get("mixed").get(1);
        expect(second).toBeInstanceOf(YMap);
        expect(second instanceof YMap ? second.get("n") : undefined).toBe(1);
    });

    it("throws on extra seed keys", () => {
        const factory = schema({
            groceries: yArray(s.string()),
        });

        expect(() =>
            factory.getInitialized({
                groceries: ["milk"],
                extra: true,
            } as never),
        ).toThrow(CrdtSchemaError);
    });

    it("does not JSON-seed xml types", () => {
        const factory = schema({
            slate: yXmlText(),
        });

        expect(() => factory.getInitialized({ slate: "" } as never)).toThrow(CrdtSchemaError);

        const doc = factory.getInitialized();
        expect(doc.get("slate").toString()).toBe("");
    });

    it("rejects JSON leaves at the top level of yjs.schema", () => {
        expect(() => schema({ messages: s.string() })).toThrow(CrdtSchemaError);
        expect(() => s.object({ note: yText() })).toThrow(CrdtSchemaError);
    });

    it("round-trips schema through toJSON/fromJSON", () => {
        const original = schema({
            groceries: yArray(s.string()),
            note: yText(),
            chats: yMap(yText()),
        });

        const restored = schema.fromJSON(original.toJSON());

        expect(restored.toJSON()).toEqual(original.toJSON());
        expect(restored.kind).toBe("y.doc");
    });

    it("rebuilds storage from schema kinds after applying encoded state", () => {
        const factory = schema({
            messages: yArray(s.string()),
        });
        const initialized = factory.getInitialized({ messages: ["hi"] });
        const empty = factory.getEmpty();

        empty.applyEncodedState({ update: initialized.getEncodedState() });
        empty.rebuildStorage();

        expect(empty.get("messages")).toBeInstanceOf(YArray);
        expect(empty.get("messages").toJSON()).toEqual(["hi"]);
    });
});
