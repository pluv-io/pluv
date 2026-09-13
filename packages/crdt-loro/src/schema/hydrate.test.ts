import { CrdtSchemaError, s } from "@pluv/crdt";
import { LoroList, LoroMap, LoroText } from "loro-crdt";
import { describe, expect, it } from "vitest";
import { loroList, loroMap, loroText, schema, storage } from "./index";

describe("loro schema hydrate", () => {
    it("inserts JSON leaves into loroList", () => {
        const doc = storage({
            schema: schema({
                groceries: loroList(s.string()),
            }),
        }).getInitialized({
            groceries: ["milk", "eggs"],
        });

        expect(doc.get("groceries")).toBeInstanceOf(LoroList);
        expect(doc.get("groceries").toArray()).toEqual(["milk", "eggs"]);
        expect(typeof doc.get("groceries").get(0)).toBe("string");
        expect(doc.toJson()).toEqual({ groceries: ["milk", "eggs"] });
    });

    it("wraps nested CRDT nodes instead of inserting JSON objects", () => {
        const doc = storage({
            schema: schema({
                chats: loroMap(loroText()),
                messages: loroList(loroMap(s.string())),
            }),
        }).getInitialized({
            chats: { note: "hi" },
            messages: [{ message: "hello", name: "ada" }],
        });

        const note = doc.get("chats").get("note");
        const message = doc.get("messages").get(0);

        expect(note).toBeInstanceOf(LoroText);
        expect(note?.toString()).toBe("hi");
        expect(message).toBeInstanceOf(LoroMap);
        expect(message?.get("message")).toBe("hello");
        expect(doc.toJson()).toEqual({
            chats: { note: "hi" },
            messages: [{ message: "hello", name: "ada" }],
        });
    });

    it("hydrates $union with first-match on seed", () => {
        const doc = storage({
            schema: schema({
                mixed: loroList(s.$union([s.string(), loroMap(s.number())])),
            }),
        }).getInitialized({
            mixed: ["hello", { n: 1 }],
        });

        expect(doc.get("mixed").get(0)).toBe("hello");
        expect(doc.get("mixed").get(1)).toBeInstanceOf(LoroMap);
        expect((doc.get("mixed").get(1) as LoroMap).get("n")).toBe(1);
    });

    it("throws on extra seed keys", () => {
        const factory = storage({
            schema: schema({
                groceries: loroList(s.string()),
            }),
        });

        expect(() =>
            factory.getInitialized({
                groceries: ["milk"],
                extra: true,
            } as never),
        ).toThrow(CrdtSchemaError);
    });

    it("rejects JSON leaves at the top level of loro.schema", () => {
        expect(() => schema({ messages: s.string() })).toThrow(CrdtSchemaError);
        expect(() => s.object({ note: loroText() })).toThrow(CrdtSchemaError);
    });

    it("round-trips schema through toJSON/fromJSON", () => {
        const original = schema({
            groceries: loroList(s.string()),
            note: loroText(),
            chats: loroMap(loroText()),
        });

        const restored = schema.fromJSON(original.toJSON());

        expect(restored.toJSON()).toEqual(original.toJSON());
        expect(restored.kind).toBe("loro.doc");
    });

    it("rebuilds storage from schema kinds after applying encoded state", () => {
        const factory = storage({
            schema: schema({
                messages: loroList(s.string()),
            }),
        });
        const initialized = factory.getInitialized({ messages: ["hi"] });
        const empty = factory.getEmpty();

        empty.applyEncodedState({ update: initialized.getEncodedState() });
        empty.rebuildStorage();

        expect(empty.get("messages")).toBeInstanceOf(LoroList);
        expect(empty.get("messages").toArray()).toEqual(["hi"]);
    });
});
