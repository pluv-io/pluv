import type { AbstractCrdtDoc, CrdtType, InferCrdtJson } from "@pluv/crdt";
import type { IOLike, Id, InferIOInput, InferIOOutput, JsonObject } from "@pluv/types";
import type { EventNotifierSubscriptionCallback } from "./EventNotifier";
import type { OtherNotifierSubscriptionCallback } from "./OtherNotifier";
import type { StateNotifierSubjects, SubscriptionCallback } from "./StateNotifier";
import type { UpdateMyPresenceAction, UserInfo, WebSocketConnection } from "./types";

export abstract class AbstractRoom<
    TIO extends IOLike,
    TPresence extends JsonObject = {},
    TStorage extends Record<string, CrdtType<any, any>> = {},
> {
    public readonly id: string;

    constructor(room: string) {
        this.id = room;
    }

    public abstract storageLoaded: boolean;

    public abstract broadcast<TEvent extends keyof InferIOInput<TIO>>(
        event: TEvent,
        data: Id<InferIOInput<TIO>[TEvent]>,
    ): void;

    public abstract canRedo(): boolean;

    public abstract canUndo(): boolean;

    public abstract getDoc(): AbstractCrdtDoc<TStorage>;

    public abstract event<TEvent extends keyof InferIOOutput<TIO>>(
        event: TEvent,
        callback: EventNotifierSubscriptionCallback<TIO, TEvent>,
    ): () => void;

    public abstract getConnection(): WebSocketConnection;

    public abstract getMyPresence(): TPresence;

    public abstract getMyself(): Id<UserInfo<TIO, TPresence>> | null;

    public abstract getOther(connectionId: string): Id<UserInfo<TIO, TPresence>> | null;

    public abstract getOthers(): readonly Id<UserInfo<TIO, TPresence>>[];

    public abstract getStorage<TKey extends keyof TStorage>(type: TKey): TStorage[TKey] | null;

    public abstract getStorageJson(): InferCrdtJson<TStorage> | null;
    public abstract getStorageJson<TKey extends keyof TStorage>(type: TKey): InferCrdtJson<TStorage[TKey]> | null;

    public abstract other(connectionId: string, callback: OtherNotifierSubscriptionCallback<TIO>): () => void;

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
