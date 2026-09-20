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
        const procedure = new TreatyPresenceProcedure().resolve((_data, { presence }) => presence);

        procedure.apply(
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
        const procedure = new TreatyPresenceProcedure().resolve((_data, context) => {
            void context.json;
            void context.json;

            return {};
        });

        procedure.apply(
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
        const procedure = new TreatyPresenceProcedure().resolve((_data, { presence }) => presence);

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
        const procedure = new TreatyPresenceProcedure().resolve((_data, context) => {
            void context.json;

            return {};
        });

        procedure.apply(
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
        const procedure = new TreatyPresenceProcedure().resolve((_data, context) => {
            (context.presence as { count: number }).count = 5;

            return {};
        });

        procedure.apply({}, { ...context, presence: live });

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
