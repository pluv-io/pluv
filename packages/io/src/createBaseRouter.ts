import type { BaseClientEventRecord, JsonObject } from "@pluv/types";
import { PING_TIMEOUT_MS } from "./constants";
import type { IODefs, SetKey } from "./IODefs";
import { PluvProcedure } from "./PluvProcedure";
import type { PluvRouter } from "./PluvRouter";
import type { IOStorageUpdatedEvent, PluvIOLimits } from "./types";
import { createInternalPluvRouter, oneLine, pickBy } from "./utils";

export type CreateBaseRouterParams<T extends IODefs = IODefs> = {
    limits: Pick<PluvIOLimits, "presenceMaxSize" | "storageMaxSize">;
    logDebug?: (...data: any[]) => void;
    onStorageUpdated: (event: IOStorageUpdatedEvent<T>) => void;
};

/**
 * Built-in `$` protocol events. Kept separate from `PluvServer` so the protocol
 * can be constructed/tested without a full server instance.
 */
export const createBaseRouter = <T extends IODefs = IODefs>(
    params: CreateBaseRouterParams<T>,
): PluvRouter<SetKey<T, "events", {}>> => {
    const { limits, onStorageUpdated } = params;
    const logDebug = params.logDebug ?? (() => undefined);

    return createInternalPluvRouter({
        $getOthers: new PluvProcedure<T, BaseClientEventRecord["$getOthers"], {}>().sync(
            (_data, { room, session, sessions }) => {
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
            },
        ),
        $initializeSession: new PluvProcedure<T, BaseClientEventRecord["$initializeSession"], {}>()
            .broadcast((data, event) => {
                const presence = data.presence ?? null;
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
                const update = data.update;

                /**
                 * @description Storage was already initialized. Don't overwrite the current
                 * storage state with the incoming initialStorage. Return what the current state
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
                        .catch((error: unknown) => {
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
        $ping: new PluvProcedure<T, BaseClientEventRecord["$ping"], {}>().self(
            (_data, { platform, session }) => {
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
            },
        ),
        $updatePresence: new PluvProcedure<
            T,
            BaseClientEventRecord["$updatePresence"],
            {}
        >().broadcast((data, context) => {
            const presence = data.presence;
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
        $updateStorage: new PluvProcedure<
            T,
            BaseClientEventRecord["$updateStorage"],
            {}
        >().broadcast(async (data, { context, doc, platform, room }) => {
            const origin = data.origin;
            const update = data.update ?? null;

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
