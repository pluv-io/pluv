import { describe, expect, it } from "vitest";
import { CrdtSchemaError } from "./error";
import { fromJSON, s } from "./s";
import { validateJson } from "./validate";

describe("s DSL", () => {
    it("round-trips JSON schema nodes through toJSON/fromJSON", () => {
        const Message = s.object({
            message: s.string(),
            name: s.string(),
            tags: s.array(s.string()),
            count: s.$optional(s.number()),
        });

        const restored = fromJSON(Message.toJSON());

        expect(restored.toJSON()).toEqual(Message.toJSON());
        expect(Message.toJSON()).toMatchObject({
            kind: "object",
            shape: {
                message: { kind: "string" },
                tags: { kind: "array", item: { kind: "string" } },
                count: { kind: "optional", inner: { kind: "number" } },
            },
        });
    });

    it("serializes combinators without a $ prefix on kind", () => {
        const node = s.$union([s.string(), s.number()]);

        expect(node.toJSON()).toEqual({
            kind: "union",
            options: [{ kind: "string" }, { kind: "number" }],
        });
        expect(fromJSON(node.toJSON()).toJSON()).toEqual(node.toJSON());
    });

    it("validates objects and rejects extra keys", () => {
        const node = s.object({ name: s.string() });

        expect(validateJson(node, { name: "ada" })).toBe(true);
        expect(validateJson(node, { name: "ada", extra: true })).toBe(false);
        expect(validateJson(node, { name: 1 })).toBe(false);
    });

    it("intersects JSON objects", () => {
        const node = s.$intersection([s.object({ a: s.string() }), s.object({ b: s.number() })]);

        expect(validateJson(node, { a: "x", b: 1 })).toBe(true);
        expect(validateJson(node, { a: "x" })).toBe(false);
        expect(node.toJSON().kind).toBe("intersection");
    });

    it("rejects $intersection of non-objects", () => {
        expect(() => s.$intersection([s.string(), s.number()])).toThrow(CrdtSchemaError);
        expect(() => s.$intersection([s.array(s.string()), s.object({ a: s.string() })])).toThrow(
            CrdtSchemaError,
        );
    });

    it("rejects nested $optional and short $union", () => {
        expect(() => s.$optional(s.$optional(s.string()))).toThrow(CrdtSchemaError);
        expect(() => s.$union([s.string()])).toThrow(CrdtSchemaError);
    });

    it("rejects empty or duplicate enums", () => {
        expect(() => s.enum([])).toThrow(CrdtSchemaError);
        expect(() => s.enum(["a", "a"])).toThrow(CrdtSchemaError);
    });
});
