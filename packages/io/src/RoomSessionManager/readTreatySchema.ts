import type { TreatyLike, TreatyProcedureInputJson } from "@pluv/types";

export type TreatyDomainSchema = {
    schema: unknown;
    procedures: Record<string, TreatyProcedureInputJson>;
};

export type TreatySchemaJson = {
    user: unknown;
    presence: TreatyDomainSchema | null;
    storage: TreatyDomainSchema | null;
};

export const readTreatySchema = (treaty: TreatyLike): TreatySchemaJson => {
    const procedures = treaty.toProceduresJson();

    return {
        user: treaty.toUserJson(),
        presence: treaty.presence
            ? { schema: treaty.toPresenceJson(), procedures: procedures.presence }
            : null,
        storage: treaty.storage
            ? { schema: treaty.toStorageJson(), procedures: procedures.storage }
            : null,
    };
};
