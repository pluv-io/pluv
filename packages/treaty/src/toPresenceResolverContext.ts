import type { BaseUser, DeepReadonly } from "@pluv/types";
import type { PresenceResolverContext, TreatyResolverDoc } from "./types";

export const toPresenceResolverContext = <
    TUser extends BaseUser,
    TPresence extends Record<string, any>,
    TJson extends Record<string, any>,
    TNative extends Record<string, any>,
>(params: {
    doc: TreatyResolverDoc<TJson, TNative>;
    presence?: TPresence | null;
    user: TUser;
}): PresenceResolverContext<TUser, TPresence, TJson> => {
    const { doc, user } = params;
    let json: DeepReadonly<TJson> | undefined;

    return {
        get json() {
            return (json ??= doc.toJson() as DeepReadonly<TJson>);
        },
        presence: JSON.parse(JSON.stringify(params.presence ?? {})) as DeepReadonly<TPresence>,
        user,
    };
};
