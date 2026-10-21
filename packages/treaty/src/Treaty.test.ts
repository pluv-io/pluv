import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createTreaty, TreatyPresenceProcedure, TreatyStorageProcedure } from "./index";

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

    it("throws when user or presence cannot emit an output JSON Schema", () => {
        const inputOnly = {
            "~standard": {
                version: 1,
                vendor: "test",
                validate: (value: unknown) => ({ value }),
                jsonSchema: {
                    input: () => ({ type: "object" }),
                },
            },
        };

        expect(() => createTreaty({ user: inputOnly as never })).toThrow(/Standard JSON Schema/);
        expect(() => createTreaty({ user, presence: inputOnly as never })).toThrow(
            /Standard JSON Schema/,
        );
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

    it("throws when a procedure is missing resolve", () => {
        const treaty = createTreaty({ user, presence });

        expect(() => treaty.router({ select: treaty.procedure.presence })).toThrow(
            'Treaty presence procedure "select" is missing resolve',
        );
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

        expect(Object.keys(merged._defs.procedures.presence).toSorted()).toEqual([
            "increment",
            "select",
        ]);
    });

    it("serializes user and presence to JSON Schema", () => {
        const treaty = createTreaty({ user, presence });

        expect(treaty.toUserJson()).toMatchObject({ type: "object" });
        expect(treaty.toPresenceJson()).toMatchObject({ type: "object" });
    });

    it("serializes user and presence as the output schema", () => {
        const treaty = createTreaty({
            user: z.object({ id: z.string(), name: z.string().default("anon") }),
            presence: z.object({ count: z.number().default(0) }),
        });

        expect(treaty.toUserJson()).toMatchObject({
            required: ["id", "name"],
            additionalProperties: false,
        });
        expect(treaty.toPresenceJson()).toMatchObject({
            required: ["count"],
            additionalProperties: false,
        });
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

    it("serializes procedure inputs and throws when an input cannot", () => {
        const treaty = createTreaty({ user, presence });
        const select = treaty.procedure.presence
            .input(z.object({ id: z.string() }))
            .resolve(() => ({}));
        const touch = treaty.procedure.presence.resolve(() => ({}));
        const routed = treaty.router({ select, touch });

        expect(routed.toProceduresJson().presence.select.input).toMatchObject({ type: "object" });
        expect(routed.toProceduresJson().presence.touch.input).toBeNull();
        expect(routed.toProceduresJson().storage).toEqual({});

        const defaulted = treaty.procedure.presence
            .input(z.object({ id: z.string().default("x") }))
            .resolve(() => ({}));

        const defaultedInput = treaty.router({ defaulted }).toProceduresJson().presence.defaulted
            .input as { properties?: { id?: { default?: string } }; required?: string[] };

        expect(defaultedInput.properties?.id?.default).toBe("x");
        expect(defaultedInput.required).toBeUndefined();

        const badInput = {
            "~standard": {
                version: 1,
                vendor: "test",
                validate: (value: unknown) => ({ value }),
            },
        };
        const bad = treaty.procedure.presence.input(badInput as never).resolve(() => ({}));
        const unrepresentable = treaty.procedure.presence
            .input(z.set(z.string()) as never)
            .resolve(() => ({}));

        expect(() => treaty.router({ bad }).toProceduresJson()).toThrow(/Standard JSON Schema/);
        expect(() => treaty.router({ unrepresentable }).toProceduresJson()).toThrow(
            "Set cannot be represented in JSON Schema",
        );
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

describe("TreatyPresenceProcedure.apply", () => {
    const context = {
        user: { id: "1" },
        presence: { count: 0 },
        doc: {
            get: () => ({}),
            toJson: () => ({}),
        },
    };

    it("throws when resolve is missing", () => {
        const procedure = new TreatyPresenceProcedure();

        expect(() => procedure.apply({}, context)).toThrow(
            "Treaty presence procedure is missing resolve",
        );
    });

    it("parses input and returns the patch", () => {
        const procedure = new TreatyPresenceProcedure()
            .input(z.object({ id: z.string() }))
            .resolve(({ id }) => ({ count: id === "a" ? 1 : 0 }));

        expect(procedure.apply({ id: "a" }, context)).toEqual({ count: 1 });
        expect(() => procedure.apply({ id: 1 }, context)).toThrow();
    });

    it("does not materialize json until it is read", () => {
        let calls = 0;
        const procedure = new TreatyPresenceProcedure().resolve(
            (_data, resolver) => resolver.presence,
        );

        void procedure.apply(
            {},
            {
                ...context,
                doc: {
                    get: () => ({}),
                    toJson: () => {
                        calls += 1;
                        return {};
                    },
                },
            },
        );

        expect(calls).toBe(0);
    });

    it("caches json after the first read", () => {
        let calls = 0;
        const procedure = new TreatyPresenceProcedure().resolve((_data, resolver) => {
            void resolver.json;
            void resolver.json;

            return {};
        });

        void procedure.apply(
            {},
            {
                ...context,
                doc: {
                    get: () => ({}),
                    toJson: () => {
                        calls += 1;
                        return {};
                    },
                },
            },
        );

        expect(calls).toBe(1);
    });

    it("defaults missing presence to an empty object", () => {
        const procedure = new TreatyPresenceProcedure().resolve(
            (_data, resolver) => resolver.presence,
        );

        expect(
            procedure.apply(
                {},
                {
                    user: { id: "1" },
                    presence: null,
                    doc: context.doc,
                },
            ),
        ).toEqual({});
    });

    it("does not call doc.get", () => {
        let getCalls = 0;
        const procedure = new TreatyPresenceProcedure().resolve((_data, resolver) => {
            void resolver.json;

            return {};
        });

        void procedure.apply(
            {},
            {
                ...context,
                doc: {
                    get: () => {
                        getCalls += 1;
                        return {};
                    },
                    toJson: () => ({}),
                },
            },
        );

        expect(getCalls).toBe(0);
    });

    it("snapshots presence so mutations do not affect the source", () => {
        const live = { count: 0 };
        const procedure = new TreatyPresenceProcedure().resolve((_data, resolver) => {
            (resolver.presence as { count: number }).count = 5;

            return {};
        });

        void procedure.apply({}, { ...context, presence: live });

        expect(live).toEqual({ count: 0 });
    });
});

describe("TreatyStorageProcedure.resolve", () => {
    it("defaults transact to true", () => {
        const procedure = new TreatyStorageProcedure().resolve(() => undefined);

        expect(procedure.config.transact).toBe(true);
    });

    it("stores transact: false", () => {
        const procedure = new TreatyStorageProcedure().resolve(() => undefined, {
            transact: false,
        });

        expect(procedure.config.transact).toBe(false);
    });

    it("snapshots presence so mutations do not affect the source", () => {
        const live = { count: 0 };
        const procedure = new TreatyStorageProcedure().resolve((_data, context) => {
            (context.presence as { count: number }).count = 5;
        });

        procedure.apply(
            {},
            {
                user: { id: "1" },
                presence: live,
                doc: {
                    get: () => ({}),
                    toJson: () => ({}),
                },
            },
        );

        expect(live).toEqual({ count: 0 });
    });
});
