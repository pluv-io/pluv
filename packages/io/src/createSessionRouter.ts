import type { BaseClientEventRecord } from "@pluv/types";
import type { IODefs, SetKey } from "./IODefs";
import { PluvProcedure } from "./PluvProcedure";
import type { PluvRouter } from "./PluvRouter";
import type { CreateBaseRouterParams } from "./createBaseRouter";
import type { SessionEventContext } from "./types";
import {
    createInternalPluvRouter,
    getMyConnectionIds,
    getSessionKind,
    groupLiveUsers,
    oneLine,
    pageLiveUsers,
    pickBy,
} from "./utils";

const baseProcedureFactory =
    <T extends IODefs>() =>
    <TEvent extends keyof BaseClientEventRecord>() => {
        return new PluvProcedure<T, BaseClientEventRecord[TEvent], {}>();
    };

type BaseRouter<T extends IODefs> = PluvRouter<SetKey<T, "events", {}>>;

const asSession = <T extends IODefs>(event: object): SessionEventContext<T> => {
    return event as SessionEventContext<T>;
};

/**
 * Session `$` events. `$initializeSession` only broadcasts `$userJoined`.
 * `manageSessions` calls `initializeStorage` for the storage half.
 */
type SessionLimits<T extends IODefs> =
    | CreateBaseRouterParams<T>["limits"]
    | null
    | (() => CreateBaseRouterParams<T>["limits"] | null);

export const createSessionRouter = <T extends IODefs = IODefs>(params: {
    limits: SessionLimits<T>;
}): BaseRouter<T> => {
    const readLimits = (): CreateBaseRouterParams<T>["limits"] | null =>
        typeof params.limits === "function" ? params.limits() : params.limits;
    const baseProcedure = baseProcedureFactory<T>();

    return createInternalPluvRouter({
        $getOthers: baseProcedure<"$getOthers">().self((_data, raw) => {
            const { session, sessions } = asSession<T>(raw);
            const presenceSeqById = new Map(
                sessions.map((item) => [item.id, item.seq.presence] as const),
            );
            const others = groupLiveUsers(sessions, {
                excludeSessionId: session.id,
            }).map(({ connectionIds, data, presence, kind, operator }) => ({
                connectionIds,
                data,
                session: {
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
                },
            }));

            return {
                $othersReceived: {
                    myConnectionIds: getMyConnectionIds(sessions, session),
                    others,
                },
            };
        }),
        $listUsers: baseProcedure<"$listUsers">().self((data, raw) => {
            const { sessions } = asSession<T>(raw);
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
        $initializeSession: baseProcedure<"$initializeSession">().broadcast((data, raw) => {
            const event = asSession<T>(raw);
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
                event.presence = presence as SessionEventContext<T>["presence"];
            }

            return {
                $userJoined: {
                    connectionId: session.id,
                    user: session.user,
                    session: {
                        kind,
                        operator: session.operator,
                        presence: session.presence ?? presence ?? {},
                        seq: { presence: session.webSocket.state.seq.presence },
                    },
                },
            };
        }),
        $ping: baseProcedure<"$ping">().self((_data, raw) => {
            const { platform, session } = asSession<T>(raw);
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
        $updatePresence: baseProcedure<"$updatePresence">().broadcast((data, raw) => {
            const context = asSession<T>(raw);
            const presence = data.presence;
            const { session } = context;

            if (!session) return {};

            const cleanedPatch = pickBy(presence ?? {}, (value) => typeof value !== "undefined");
            const updated = Object.assign(Object.create(null), session.presence, cleanedPatch);
            const bytes = new TextEncoder().encode(JSON.stringify(updated)).length;
            const limits = readLimits();
            const presenceMaxSize = limits?.presenceMaxSize;

            if (!!presenceMaxSize && bytes > presenceMaxSize) {
                throw new Error(oneLine`
                    Large presence. Presence must be at most
                    ${presenceMaxSize.toLocaleString()} bytes.
                    Current size: ${bytes.toLocaleString()} bytes
                `);
            }

            context.presence = updated;

            return {
                $presenceUpdated: {
                    user: session.user,
                    session: {
                        presence: updated,
                        seq: { presence: session.webSocket.state.seq.presence },
                        kind: session.kind,
                        operator: session.operator,
                    },
                },
            };
        }),
    });
};
