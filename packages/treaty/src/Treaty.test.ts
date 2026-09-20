import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createTreaty } from "./index";

const user = z.object({ id: z.string() });
const presence = z.object({ count: z.number() });

describe("createTreaty", () => {
    it("throws when user is missing Standard JSON Schema", () => {
        const fakeUser = {
            "~standard": {
                version: 1,
                vendor: "test",
                validate: (value: unknown) => ({ value }),
            },
        };

        expect(() => createTreaty({ user: fakeUser as never })).toThrow(/Standard JSON Schema/);
    });

    it("throws on duplicate procedure names", () => {
        const treaty = createTreaty({ user, presence });
        const select = treaty.procedure.presence.resolve(() => ({}));
        const routed = treaty.router({ select });

        expect(() => routed.router({ select })).toThrow('Duplicate presence procedure "select"');
    });

    it("throws on unknown procedure kind", () => {
        const treaty = createTreaty({ user, presence });

        expect(() =>
            treaty.router({
                bad: { kind: "nope", config: {} } as never,
            }),
        ).toThrow('Unknown treaty procedure kind for "bad"');
    });

    it("allows procedure names that exist on Object.prototype", () => {
        const treaty = createTreaty({ user, presence });
        const toString = treaty.procedure.presence.resolve(() => ({}));

        expect(() => treaty.router({ toString })).not.toThrow();
    });

    it("merges procedures from this and the argument", () => {
        const treaty = createTreaty({ user, presence });
        const select = treaty.procedure.presence.resolve(() => ({}));
        const increment = treaty.procedure.presence.resolve(() => ({}));
        const left = treaty.router({ select });
        const right = treaty.router({ increment });
        const merged = left.mergeRouters(right);

        expect(Object.keys(merged._defs.procedures.presence).sort()).toEqual([
            "increment",
            "select",
        ]);
    });

    it("serializes user and presence to JSON Schema", () => {
        const treaty = createTreaty({ user, presence });

        expect(treaty.toUserJson()).toMatchObject({ type: "object" });
        expect(treaty.toPresenceJson()).toMatchObject({ type: "object" });
    });

    it("throws when serializing optional treaty parts that are missing", () => {
        const treaty = createTreaty({ user });

        expect(() => treaty.toPresenceJson()).toThrow("Treaty has no presence schema");
        expect(() => treaty.toStorageJson()).toThrow("Treaty has no storage schema");
    });

    it("serializes storage when the factory implements toJSON", () => {
        const storage = {
            toJSON: () => ({ kind: "y.doc", shape: {} }),
        };

        const treaty = createTreaty({ user, storage: storage as never });

        expect(treaty.toStorageJson()).toEqual({ kind: "y.doc", shape: {} });
    });

    it("throws when merged routers share a procedure name", () => {
        const treaty = createTreaty({ user, presence });
        const select = treaty.procedure.presence.resolve(() => ({}));
        const left = treaty.router({ select });
        const right = treaty.router({ select });

        expect(() => left.mergeRouters(right)).toThrow(
            'Duplicate presence procedure "select" when merging treaty routers',
        );
    });
});
