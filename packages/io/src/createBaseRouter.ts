import type { BaseClientEventRecord } from "@pluv/types";
import type { IODefs, SetKey } from "./IODefs";
import { PluvProcedure } from "./PluvProcedure";
import type { PluvRouter } from "./PluvRouter";
import type { IOStorageUpdatedEvent, PluvIOLimits, EventResolverContext } from "./types";
import {
    createInternalPluvRouter,
    getMyConnectionIds,
    getSessionKind,
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
            }).map(({ connectionIds, data, presence, kind, operator }) => ({
                connectionIds,
                data,
                kind,
                operator,
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

                const kind = getSessionKind(session);
                const participantId = session.user.id;
                const latestSeq = event.sessions.reduce<number | null>((max, other) => {
                    if (other.quit) return max;
                    const otherKind = getSessionKind(other);
                    const otherId = other.user?.id;
                    if (otherKind !== kind || otherId !== participantId) return max;

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
                        kind,
                        operator: session.operator,
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
                const stateVector = data.stateVector ?? null;
                const stateForClient = (encodedState: string): string => {
                    if (!stateVector) return encodedState;

                    return doc.encodeDiff(stateVector);
                };

                /**
                 * @description Storage was already initialized. Don't overwrite the current
                 * storage state with the incoming initialStorage. Return the operations the
                 * caller's state vector is missing, or the whole document when they did not
                 * send one.
                 * @date May 7, 2025
                 */
                if (event.storageSeeded) {
                    return {
                        $storageReceived: {
                            changeKind: "unchanged",
                            state: stateVector
                                ? doc.encodeDiff(stateVector)
                                : doc.getEncodedState(),
                        },
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
                        kind: session?.kind,
                        operator: session?.operator,
                        platform,
                        room,
                        user: session?.user,
                        webSocket: session?.webSocket.webSocket,
                    });

                    return {
                        $storageReceived: {
                            changeKind: "initialized",
                            state: stateForClient(encodedState),
                        },
                    };
                }

                const encodedState = doc.getEncodedState();

                return {
                    $storageReceived: { changeKind: "empty", state: stateForClient(encodedState) },
                };
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
                    kind: session.kind,
                    operator: session.operator,
                },
            };
        }),
        $syncStorage: baseProcedure<"$syncStorage">().self((data, { doc }) => {
            const update = data.stateVector ? doc.encodeDiff(data.stateVector) : "";

            return { $storageDiff: { update } };
        }),
        $updateStorage: baseProcedure<"$updateStorage">().broadcast(
            async (data, { context, doc, platform, room, session }) => {
                const origin = data.origin;
                const update = data.update ?? null;

                if (origin === "$initialized") return {};

                if (update) doc.applyEncodedState({ update });

                const encodedState = doc.getEncodedState();
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
                    kind: session?.kind,
                    operator: session?.operator,
                    platform,
                    room,
                });

                // Persistence keeps the snapshot. Occupants only need this update.
                return { $storageUpdated: { state: update || encodedState } };
            },
        ),
    });
};
