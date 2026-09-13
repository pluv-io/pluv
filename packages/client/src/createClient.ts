import type { AbstractCrdtDocFactory } from "@pluv/crdt";
import type { InferIOCrdtKind, IOLike, StandardSchemaV1 } from "@pluv/types";
import type { PluvClientOptions } from "./PluvClient";
import { PluvClient } from "./PluvClient";

export const createClient = <
    TIO extends IOLike<any, any, any>,
    TPresenceSchema extends StandardSchemaV1<any, any> | undefined = undefined,
    TCrdt extends AbstractCrdtDocFactory<any, any, any, any> = InferIOCrdtKind<TIO>,
    TMetadataSchema extends StandardSchemaV1<any, any> | undefined = undefined,
>(
    options: PluvClientOptions<TIO, TPresenceSchema, TCrdt, TMetadataSchema>,
): PluvClient<TIO, TPresenceSchema, TCrdt, TMetadataSchema> => {
    return new PluvClient<TIO, TPresenceSchema, TCrdt, TMetadataSchema>(options);
};
