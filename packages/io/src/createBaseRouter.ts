import type { BaseClientEventRecord } from "@pluv/types";
import type { IODefs, SetKey } from "./IODefs";
import { PluvProcedure } from "./PluvProcedure";
import type { PluvRouter } from "./PluvRouter";
import type { IOStorageUpdatedEvent, PluvIOLimits, EventResolverContext } from "./types";
import {
    createInternalPluvRouter,
    getMyConnectionIds,
    groupLiveUsers,
    oneLine,
    pageLiveUsers,
    pickBy,
} from "./utils";

export type CreateBaseRouterParams<T extends IODefs = IODefs> = {
    limits: Pick<PluvIOLimits, "presenceMaxSize" | "storageMaxSize">;
    logDebug?: (...data: any[]) => void;
    onStorageUpdated: (event: IOStorageUpdatedEvent<T>) => void;
};

const baseProcedureFactory =
    <T extends IODefs>() =>
    <TEvent extends keyof BaseClientEventRecord>() => {
        return new PluvProcedure<T, BaseClientEventRecord[TEvent], {}>();
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
    const baseProcedure = baseProcedureFactory<T>();

    return createInternalPluvRouter({
        $getOthers: baseProcedure<"$getOthers">().self((_data, { session, sessions }) => {
            const presenceSeqById = new Map(
                sessions.map((item) => [item.id, item.seq.presence] as const),
            );
            const others = groupLiveUsers(sessions, {
                excludeSessionId: session.id,
            }).map(({ connectionIds, data, presence }) => ({
                connectionIds,
                data,
                presence,
                seq: {
                    presence: connectionIds.reduce<number | null>((max, id) => {
                        const seq = presenceSeqById.get(id) ?? null;

                        if (typeof seq !== "number") return max;
                        if (typeof max !== "number") return seq;

                        return seq > max ? seq : max;
                    }, null),
                },
            }));

            return {
                $othersReceived: {
                    myConnectionIds: getMyConnectionIds(sessions, session),
                    others,
                },
            };
        }),
        $listUsers: baseProcedure<"$listUsers">().self((data, { sessions }) => {
            const result = pageLiveUsers(sessions, data);

            if (!result.success) {
                return {
                    $usersPage: {
                        requestId: data.requestId,
                        success: false,
                        error: {
                            code:
                                result.error.code === "INVALID_LIMIT" ? "INVALID_LIMIT" : "FAILED",
                            message: result.error.message,
                        },
                    },
                };
            }

            return {
                $usersPage: {
                    requestId: data.requestId,
                    success: true,
                    pageInfo: result.pageInfo,
                    users: result.users,
                },
            };
        }),
        $initializeSession: baseProcedure<"$initializeSession">()
            .broadcast((data, event) => {
                const presence = data.presence ?? null;
                const { session } = event;

                if (!session) return {};

                const userId = session.user.id;
                const latestSeq = event.sessions.reduce<number | null>((max, other) => {
                    if (other.quit) return max;
                    if (other.user?.id !== userId) return max;

                    const seq = other.seq.presence;

                    if (typeof seq !== "number") return max;
                    if (typeof max !== "number") return seq;

                    return seq > max ? seq : max;
                }, null);

                // Connecting another tab is not a presence write. Keep the last
                // `$updatePresence` instead of last-connect.
                if (typeof latestSeq !== "number") {
                    event.presence = presence as EventResolverContext<T>["presence"];
                }

                return {
                    $userJoined: {
                        connectionId: session.id,
                        user: session.user,
                        presence: session.presence ?? presence ?? {},
                        seq: { presence: session.webSocket.state.seq.presence },
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
        $ping: baseProcedure<"$ping">().self((_data, { platform, session }) => {
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
        $updatePresence: baseProcedure<"$updatePresence">().broadcast((data, context) => {
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
                    seq: { presence: session.webSocket.state.seq.presence },
                    user: session.user,
                },
            };
        }),
        $updateStorage: baseProcedure<"$updateStorage">().broadcast(
            async (data, { context, doc, platform, room }) => {
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
            },
        ),
    });
};
