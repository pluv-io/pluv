import type { AbstractCrdtDocFactory } from "@pluv/crdt";
import type { BaseUser, StandardSchemaV1, TreatyLike, TreatyProcedureLike } from "@pluv/types";
import { TreatyPresenceProcedure } from "./TreatyPresenceProcedure";
import { TreatyStorageProcedure } from "./TreatyStorageProcedure";
import type {
    InferTreatyPresenceOutput,
    InferTreatyStorageJson,
    InferTreatyStorageNative,
    InferTreatyUserOutput,
    JsonSchemaProducer,
} from "./types";

const JSON_SCHEMA_TARGET = "draft-2020-12";

type PartitionPresence<TEvents extends Record<string, TreatyProcedureLike>> = {
    [
        K in keyof TEvents as TEvents[K] extends TreatyProcedureLike<"presence"> ? K : never
    ]: TEvents[K];
};

type PartitionStorage<TEvents extends Record<string, TreatyProcedureLike>> = {
    [
        K in keyof TEvents as TEvents[K] extends TreatyProcedureLike<"storage"> ? K : never
    ]: TEvents[K];
};

type HasPresenceSchema<TPresence> = [TPresence] extends [undefined]
    ? false
    : [TPresence] extends [never]
      ? false
      : true;

type HasStorageSchema<TStorage> = [TStorage] extends [undefined]
    ? false
    : [TStorage] extends [never]
      ? false
      : TStorage extends AbstractCrdtDocFactory<any, any, any, any>
        ? true
        : false;

type TreatyProcedureAccessors<
    TUserSchema extends StandardSchemaV1<unknown, BaseUser>,
    TPresenceSchema,
    TStorage,
> = (HasPresenceSchema<TPresenceSchema> extends true
    ? {
          presence: TreatyPresenceProcedure<
              InferTreatyUserOutput<TUserSchema>,
              InferTreatyPresenceOutput<TPresenceSchema>
          >;
      }
    : {}) &
    (HasStorageSchema<TStorage> extends true
        ? {
              storage: TreatyStorageProcedure<
                  InferTreatyUserOutput<TUserSchema>,
                  InferTreatyStorageJson<TStorage>,
                  InferTreatyStorageNative<TStorage>
              >;
          }
        : {});

type RouterEventMap<TPresenceSchema, TStorage> = Record<
    string,
    | (HasPresenceSchema<TPresenceSchema> extends true ? TreatyProcedureLike<"presence"> : never)
    | (HasStorageSchema<TStorage> extends true ? TreatyProcedureLike<"storage"> : never)
>;

type MergeTreatyProcedureMaps<
    TTreaties extends readonly Treaty<any, any, any, any, any>[],
    TPresence extends Record<string, any>,
    TStorage extends Record<string, any>,
> = TTreaties extends readonly [
    infer IHead extends Treaty<any, any, any, any, any>,
    ...infer ITail extends Treaty<any, any, any, any, any>[],
]
    ? MergeTreatyProcedureMaps<
          ITail,
          TPresence & IHead["_defs"]["procedures"]["presence"],
          TStorage & IHead["_defs"]["procedures"]["storage"]
      >
    : { presence: TPresence; storage: TStorage };

export type CreateTreatyConfig<
    TUserSchema extends StandardSchemaV1<unknown, BaseUser>,
    TPresenceSchema extends StandardSchemaV1<any, any> | undefined = undefined,
    TStorage extends AbstractCrdtDocFactory<any, any, any, any> | undefined = undefined,
> = {
    user: TUserSchema;
    presence?: TPresenceSchema;
    storage?: TStorage;
};

const getJsonSchemaProducer = (schema: unknown): JsonSchemaProducer | null => {
    const jsonSchema = (schema as { "~standard"?: { jsonSchema?: JsonSchemaProducer } })?.[
        "~standard"
    ]?.jsonSchema;

    if (!jsonSchema || typeof jsonSchema.input !== "function") return null;

    return jsonSchema;
};

const assertSerializingSchema = (schema: unknown, label: string): void => {
    if (!getJsonSchemaProducer(schema)) {
        throw new Error(
            `${label} must implement Standard Schema and Standard JSON Schema on the same object (e.g. Zod 4.2+ or ArkType).`,
        );
    }
};

const toJsonSchema = (schema: unknown, label: string): unknown => {
    const producer = getJsonSchemaProducer(schema);

    if (!producer) {
        throw new Error(
            `${label} must implement Standard Schema and Standard JSON Schema on the same object (e.g. Zod 4.2+ or ArkType).`,
        );
    }

    return producer.input({ target: JSON_SCHEMA_TARGET });
};

export class Treaty<
    TUserSchema extends StandardSchemaV1<unknown, BaseUser> = StandardSchemaV1<unknown, BaseUser>,
    TPresenceSchema extends StandardSchemaV1<any, any> | undefined =
        | StandardSchemaV1<any, any>
        | undefined,
    TStorage extends AbstractCrdtDocFactory<any, any, any, any> | undefined =
        | AbstractCrdtDocFactory<any, any, any, any>
        | undefined,
    TPresenceProcedures extends Record<string, TreatyProcedureLike<"presence">> = {},
    TStorageProcedures extends Record<string, TreatyProcedureLike<"storage">> = {},
> implements TreatyLike {
    public readonly user: TUserSchema;
    public readonly presence: TPresenceSchema;
    public readonly storage: TStorage;

    public readonly _defs: {
        user: TUserSchema;
        presence: TPresenceSchema;
        storage: TStorage;
        procedures: {
            presence: TPresenceProcedures;
            storage: TStorageProcedures;
        };
    };

    public get procedure(): TreatyProcedureAccessors<TUserSchema, TPresenceSchema, TStorage> {
        const accessors = {} as TreatyProcedureAccessors<TUserSchema, TPresenceSchema, TStorage>;

        if (this.presence) {
            (accessors as { presence: TreatyPresenceProcedure<any, any> }).presence =
                new TreatyPresenceProcedure();
        }

        if (this.storage) {
            (accessors as { storage: TreatyStorageProcedure<any, any, any> }).storage =
                new TreatyStorageProcedure();
        }

        return accessors;
    }

    constructor(
        config: CreateTreatyConfig<TUserSchema, TPresenceSchema, TStorage>,
        procedures: {
            presence: TPresenceProcedures;
            storage: TStorageProcedures;
        } = { presence: {} as TPresenceProcedures, storage: {} as TStorageProcedures },
    ) {
        this.user = config.user;
        this.presence = config.presence as TPresenceSchema;
        this.storage = config.storage as TStorage;
        this._defs = {
            user: this.user,
            presence: this.presence,
            storage: this.storage,
            procedures,
        };
    }

    public mergeRouters<
        TTreaties extends Treaty<TUserSchema, TPresenceSchema, TStorage, any, any>[],
    >(
        ...treaties: TTreaties
    ): Treaty<
        TUserSchema,
        TPresenceSchema,
        TStorage,
        MergeTreatyProcedureMaps<TTreaties, TPresenceProcedures, TStorageProcedures>["presence"],
        MergeTreatyProcedureMaps<TTreaties, TPresenceProcedures, TStorageProcedures>["storage"]
    > {
        const presence = Object.create(null) as Record<string, TreatyProcedureLike<"presence">>;
        const storage = Object.create(null) as Record<string, TreatyProcedureLike<"storage">>;

        for (const treaty of [this, ...treaties]) {
            for (const name of Object.keys(treaty._defs.procedures.presence)) {
                if (Object.hasOwn(presence, name)) {
                    throw new Error(
                        `Duplicate presence procedure "${name}" when merging treaty routers`,
                    );
                }

                presence[name] = treaty._defs.procedures.presence[name];
            }

            for (const name of Object.keys(treaty._defs.procedures.storage)) {
                if (Object.hasOwn(storage, name)) {
                    throw new Error(
                        `Duplicate storage procedure "${name}" when merging treaty routers`,
                    );
                }

                storage[name] = treaty._defs.procedures.storage[name];
            }
        }

        return new Treaty(
            { user: this.user, presence: this.presence, storage: this.storage },
            { presence, storage },
        ) as any;
    }

    public router<TEvents extends RouterEventMap<TPresenceSchema, TStorage>>(
        events: TEvents,
    ): Treaty<
        TUserSchema,
        TPresenceSchema,
        TStorage,
        TPresenceProcedures & PartitionPresence<TEvents>,
        TStorageProcedures & PartitionStorage<TEvents>
    > {
        const presence = Object.assign(
            Object.create(null),
            this._defs.procedures.presence,
        ) as TPresenceProcedures & PartitionPresence<TEvents>;
        const storage = Object.assign(
            Object.create(null),
            this._defs.procedures.storage,
        ) as TStorageProcedures & PartitionStorage<TEvents>;

        Object.entries(events).forEach(([name, procedure]) => {
            if (procedure.kind === "presence") {
                if (Object.hasOwn(presence, name)) {
                    throw new Error(`Duplicate presence procedure "${name}"`);
                }

                (presence as Record<string, TreatyProcedureLike<"presence">>)[name] = procedure;
                return;
            }

            if (procedure.kind === "storage") {
                if (Object.hasOwn(storage, name)) {
                    throw new Error(`Duplicate storage procedure "${name}"`);
                }

                (storage as Record<string, TreatyProcedureLike<"storage">>)[name] = procedure;
                return;
            }

            throw new Error(`Unknown treaty procedure kind for "${name}"`);
        });

        return new Treaty(
            { user: this.user, presence: this.presence, storage: this.storage },
            { presence, storage },
        );
    }

    public toUserJson(): unknown {
        return toJsonSchema(this.user, "Treaty user");
    }

    public toPresenceJson(): unknown {
        if (!this.presence) {
            throw new Error("Treaty has no presence schema");
        }

        return toJsonSchema(this.presence, "Treaty presence");
    }

    public toStorageJson(): unknown {
        const storage = this.storage as { toJSON?: () => unknown } | undefined;

        if (!storage || typeof storage.toJSON !== "function") {
            throw new Error("Treaty has no storage schema");
        }

        return storage.toJSON();
    }
}

export const createTreaty = <
    TUserSchema extends StandardSchemaV1<unknown, BaseUser>,
    TPresenceSchema extends StandardSchemaV1<any, any> | undefined = undefined,
    TStorage extends AbstractCrdtDocFactory<any, any, any, any> | undefined = undefined,
>(
    config: CreateTreatyConfig<TUserSchema, TPresenceSchema, TStorage>,
): Treaty<TUserSchema, TPresenceSchema, TStorage> => {
    assertSerializingSchema(config.user, "Treaty user");

    if (config.presence) {
        assertSerializingSchema(config.presence, "Treaty presence");
    }

    return new Treaty(config);
};
