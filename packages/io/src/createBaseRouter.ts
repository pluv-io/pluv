import type { JsonObject, Maybe } from "@pluv/types";
import type { AbstractPlatform, InferInitContextType } from "./AbstractPlatform";
import { PING_TIMEOUT_MS } from "./constants";
import { PluvProcedure } from "./PluvProcedure";
import { PluvRouter } from "./PluvRouter";
import type { IOStorageUpdatedEvent, PluvIOAuthorize, PluvIOLimits } from "./types";
import { oneLine, pickBy } from "./utils";

export type CreateBaseRouterParams<
    TPlatform extends AbstractPlatform<any, any> = AbstractPlatform<any, any>,
    TAuthorize extends PluvIOAuthorize<TPlatform, any, InferInitContextType<TPlatform>> =
        PluvIOAuthorize<TPlatform, any, InferInitContextType<TPlatform>>,
    TContext extends Record<string, any> = {},
> = {
    limits: Pick<PluvIOLimits, "presenceMaxSize" | "storageMaxSize">;
    logDebug?: (...data: any[]) => void;
    onStorageUpdated: (event: IOStorageUpdatedEvent<TPlatform, TAuthorize, TContext>) => void;
};

/**
 * Built-in `$` protocol events. Kept separate from `PluvServer` so the protocol
 * can be constructed/tested without a full server instance.
 */
export const createBaseRouter = <
    TPlatform extends AbstractPlatform<any, any> = AbstractPlatform<any, any>,
    TAuthorize extends PluvIOAuthorize<TPlatform, any, InferInitContextType<TPlatform>> =
        PluvIOAuthorize<TPlatform, any, InferInitContextType<TPlatform>>,
    TContext extends Record<string, any> = {},
>(
    params: CreateBaseRouterParams<TPlatform, TAuthorize, TContext>,
): PluvRouter<TPlatform, TAuthorize, TContext, {}> => {
    const { limits, onStorageUpdated } = params;
    const logDebug = params.logDebug ?? (() => undefined);
    const procedure = new PluvProcedure<TPlatform, TAuthorize, TContext, {}, {}>();

    return new PluvRouter({
        $getOthers: procedure.sync((data, { room, session, sessions }) => {
            const currentTime = Date.now();

            const others = sessions
                .filter((wsSession) => {
                    if (wsSession.id === session?.id) return false;
                    if (wsSession.quit) return false;
                    if (currentTime - wsSession.timers.ping > PING_TIMEOUT_MS) return false;

                    return true;
                })
                .reduce<
                    Record<
                        string,
                        {
                            connectionId: string;
                            presence: unknown;
                            room: string | null;
                            timers: { presence: number | null };
                            user: JsonObject | null;
                        }
                    >
                >((acc, { id, presence, timers, user }) => {
                    acc[id] = {
                        connectionId: id,
                        presence,
                        room,
                        timers: { presence: timers.presence },
                        user,
                    };

                    return acc;
                }, {});

            return { $othersReceived: { others } };
        }),
        $initializeSession: procedure
            .broadcast((data, event) => {
                const presence = (data as any)?.presence ?? null;
                const { session } = event;

                if (!session) return {};

                event.presence = presence;

                return {
                    $userJoined: {
                        connectionId: session.id,
                        user: session.user,
                        presence,
                        timers: { presence: session.webSocket.state.timers.presence },
                    },
                };
            })
            .self(async (data, event) => {
                const { context, doc, platform, room, session } = event;
                /**
                 * @description This is the frontend's initialStorage. We only want to
                 * apply this if the server has not already been seeded (persistence,
                 * getInitialStorage, or an earlier client seed).
                 */
                const update = (data as any)?.update as Maybe<string>;

                /**
                 * @description Storage was already initialized. Don't overwrite the current
                 * storage state with the incoming initial storage. Return what the current state
                 * is without changes.
                 * @date May 7, 2025
                 */
                if (event.storageSeeded) {
                    const encodedState = doc.getEncodedState();

                    return {
                        $storageReceived: { changeKind: "unchanged", state: encodedState },
                    };
                }

                /**
                 * @description Storage was never initialized, and there is an incoming
                 * initialStorage from the client. Apply the initialStorage and persist the state
                 * as an update.
                 * @date May 7, 2025
                 */
                if (!!update) {
                    const encodedState = doc.applyEncodedState({ update }).getEncodedState();
                    const storageSize = new TextEncoder().encode(encodedState).length;

                    if (!!limits.storageMaxSize && storageSize > limits.storageMaxSize) {
                        throw new Error("Storage has exceeded the size limit");
                    }

                    event.storageSeeded = true;

                    await platform.persistence
                        .setStorageState(room, encodedState)
                        .catch((error) => {
                            logDebug(error);
                        });

                    onStorageUpdated({
                        context,
                        encodedState,
                        platform,
                        room,
                        user: session?.user,
                        webSocket: session?.webSocket.webSocket,
                    });

                    return {
                        $storageReceived: { changeKind: "initialized", state: encodedState },
                    };
                }

                const encodedState = doc.getEncodedState();

                return { $storageReceived: { changeKind: "empty", state: encodedState } };
            }),
        $ping: procedure.self((data, { platform, session }) => {
            if (!session) return {};

            const currentTime = new Date().getTime();
            const prevState = session.webSocket.state;

            platform.setSerializedState(session.webSocket, {
                ...prevState,
                timers: {
                    ...prevState.timers,
                    ping: currentTime,
                },
            });

            return { $pong: {} };
        }),
        $updatePresence: procedure.broadcast((data, context) => {
            const presence = (data as any)?.presence;
            const { session } = context;

            if (!session) return {};

            const cleanedPatch = pickBy(presence ?? {}, (value) => typeof value !== "undefined");
            const updated = Object.assign(Object.create(null), session.presence, cleanedPatch);
            const bytes = new TextEncoder().encode(JSON.stringify(updated)).length;

            if (!!limits.presenceMaxSize && bytes > limits.presenceMaxSize) {
                throw new Error(oneLine`
                    Large presence. Presence must be at most
                    ${limits.presenceMaxSize.toLocaleString()} bytes.
                    Current size: ${bytes.toLocaleString()} bytes
                `);
            }

            context.presence = updated;

            return {
                $presenceUpdated: {
                    presence: updated,
                    timers: { presence: session.timers.presence },
                },
            };
        }),
        $updateStorage: procedure.broadcast(async (data, { context, doc, platform, room }) => {
            const origin = (data as any)?.origin as Maybe<string>;
            const update: string | null = (data as any)?.update ?? null;

            if (origin === "$initialized") return {};

            const updated = update === null ? doc : doc.applyEncodedState({ update });
            const encodedState = updated.getEncodedState();
            const storageSize = new TextEncoder().encode(encodedState).length;

            if (!!limits.storageMaxSize && storageSize > limits.storageMaxSize) {
                throw new Error(oneLine`
                        Large Storage. Storage must be at most
                        ${limits.storageMaxSize.toLocaleString()} bytes.
                        Current size: ${storageSize.toLocaleString()} bytes
                    `);
            }

            await platform.persistence.setStorageState(room, encodedState);

            onStorageUpdated({
                context,
                encodedState,
                platform,
                room,
            });

            return { $storageUpdated: { state: encodedState } };
        }),
    });
};
