import type { CrdtType, InferCrdtJson } from "@pluv/crdt";
import type { CrdtDocLike, IOLike, Id, InferIOInput, InferIOOutput, JsonObject } from "@pluv/types";
import type { EventNotifierSubscriptionCallback } from "./EventNotifier";
import type { OtherNotifierSubscriptionCallback } from "./OtherNotifier";
import type { MergeEvents, PluvRouterEventConfig } from "./PluvRouter";
import type { StateNotifierSubjects, SubscriptionCallback } from "./StateNotifier";
import type { UpdateMyPresenceAction, UserInfo, WebSocketConnection } from "./types";

export abstract class AbstractRoom<
    TIO extends IOLike,
    TPresence extends JsonObject = {},
    TStorage extends Record<string, CrdtType<any, any>> = {},
    TEvents extends PluvRouterEventConfig<TIO, TPresence, TStorage> = {},
> {
    public readonly id: string;

    constructor(room: string) {
        this.id = room;
    }

    public abstract storageLoaded: boolean;

    public abstract broadcast<TEvent extends keyof InferIOInput<MergeEvents<TEvents, TIO>>>(
        event: TEvent,
        data: Id<InferIOInput<MergeEvents<TEvents, TIO>>[TEvent]>,
    ): void;

    public abstract canRedo(): boolean;

    public abstract canUndo(): boolean;

    public abstract getDoc(): CrdtDocLike<TStorage>;

    public abstract event<TEvent extends keyof InferIOOutput<MergeEvents<TEvents, TIO>>>(
        event: TEvent,
        callback: EventNotifierSubscriptionCallback<MergeEvents<TEvents, TIO>, TEvent>,
    ): () => void;

    public abstract getConnection(): WebSocketConnection;

    public abstract getMyPresence(): TPresence;

    public abstract getMyself(): Id<UserInfo<TIO, TPresence>> | null;

    public abstract getOther(connectionId: string): Id<UserInfo<TIO, TPresence>> | null;

    public abstract getOthers(): readonly Id<UserInfo<TIO, TPresence>>[];

    public abstract getStorage<TKey extends keyof TStorage>(type: TKey): TStorage[TKey] | null;

    public abstract getStorageJson(): InferCrdtJson<TStorage> | null;
    public abstract getStorageJson<TKey extends keyof TStorage>(
        type: TKey,
    ): InferCrdtJson<TStorage[TKey]> | null;

    public abstract other(
        connectionId: string,
        callback: OtherNotifierSubscriptionCallback<TIO, TPresence>,
    ): () => void;

    public abstract redo(): void;

    public abstract storage<TKey extends keyof TStorage>(
        key: TKey,
        fn: (value: InferCrdtJson<TStorage[TKey]>) => void,
    ): () => void;

    public abstract storageRoot(
        fn: (value: {
            [P in keyof TStorage]: InferCrdtJson<TStorage[P]>;
        }) => void,
    ): () => void;

    public abstract subscribe<TSubject extends keyof StateNotifierSubjects<TIO, TPresence>>(
        name: TSubject,
        callback: SubscriptionCallback<TIO, TPresence, TSubject>,
    ): () => void;

    public abstract transact(fn: (storage: TStorage) => void, origin?: string): void;

    public abstract undo(): void;

    public abstract updateMyPresence(presence: UpdateMyPresenceAction<TPresence>): void;
}
