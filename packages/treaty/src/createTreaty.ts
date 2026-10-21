import type { AbstractCrdtDocFactory } from "@pluv/crdt";
import type { BaseUser, StandardSchemaV1 } from "@pluv/types";
import { Treaty, type CreateTreatyConfig } from "./Treaty";
import { assertOutputJsonSchema } from "./utils";

export const createTreaty = <
    TUserSchema extends StandardSchemaV1<unknown, BaseUser>,
    TPresenceSchema extends StandardSchemaV1<any, any> | undefined = undefined,
    TStorage extends AbstractCrdtDocFactory<any, any, any, any> | undefined = undefined,
>(
    config: CreateTreatyConfig<TUserSchema, TPresenceSchema, TStorage>,
): Treaty<TUserSchema, TPresenceSchema, TStorage> => {
    assertOutputJsonSchema(config.user);

    if (config.presence) {
        assertOutputJsonSchema(config.presence);
    }

    return new Treaty(config);
};
