import type { BaseUser, DeepReadonly, OperatorUser } from "@pluv/types";
import type { StorageResolverContext, TreatyResolverDoc } from "./types";

export const toStorageResolverContext = <
    TUser extends BaseUser,
    TPresence extends Record<string, any>,
    TJson extends Record<string, any>,
    TNative extends Record<string, any>,
>(params: {
    doc: TreatyResolverDoc<TJson, TNative>;
    operator?: OperatorUser | null;
    presence?: TPresence | null;
    user: TUser;
}): StorageResolverContext<TUser, TJson, TNative, TPresence> => {
    const { doc, user } = params;
    let json: DeepReadonly<TJson> | undefined;

    return {
        get json() {
            return (json ??= doc.toJson() as DeepReadonly<TJson>);
        },
        operator: params.operator ?? null,
        presence: JSON.parse(JSON.stringify(params.presence ?? {})) as DeepReadonly<TPresence>,
        storage: doc.get(),
        user,
    };
};
