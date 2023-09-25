import type { InferYjsSharedTypeJson } from "@pluv/crdt-yjs";
import type {
    Id,
    InferIOInput,
    InferIOOutput,
    IOLike,
    JsonObject,
} from "@pluv/types";
import type { AbstractType } from "yjs";
import type { EventNotifierSubscriptionCallback } from "./EventNotifier";
import type { OtherNotifierSubscriptionCallback } from "./OtherNotifier";
import type {
    StateNotifierSubjects,
    SubscriptionCallback,
} from "./StateNotifier";
import type { UserInfo, WebSocketConnection } from "./types";

export abstract class AbstractRoom<
    TIO extends IOLike,
    TPresence extends JsonObject = {},
    TStorage extends Record<string, AbstractType<any>> = {},
> {
    public readonly id: string;

    constructor(room: string) {
        this.id = room;
    }

    public abstract broadcast<TEvent extends keyof InferIOInput<TIO>>(
        event: TEvent,
        data: Id<InferIOInput<TIO>[TEvent]>,
    ): void;

    public abstract canRedo(): boolean;

    public abstract canUndo(): boolean;

    public abstract event<TEvent extends keyof InferIOOutput<TIO>>(
        event: TEvent,
        callback: EventNotifierSubscriptionCallback<TIO, TEvent>,
    ): () => void;

    public abstract getConnection(): WebSocketConnection;

    public abstract getMyPresence(): TPresence;

    public abstract getMyself(): Id<UserInfo<TIO, TPresence>> | null;

    public abstract getOther(
        connectionId: string,
    ): Id<UserInfo<TIO, TPresence>> | null;

    public abstract getOthers(): readonly Id<UserInfo<TIO, TPresence>>[];

    public abstract getStorage<TKey extends keyof TStorage>(
        key: TKey,
    ): TStorage[TKey] | null;

    public abstract other(
        connectionId: string,
        callback: OtherNotifierSubscriptionCallback<TIO>,
    ): () => void;

    public abstract redo(): void;

    public abstract storage<TKey extends keyof TStorage>(
        key: TKey,
        fn: (value: InferYjsSharedTypeJson<TStorage[TKey]>) => void,
    ): () => void;

    public abstract storageRoot(
        fn: (value: {
            [P in keyof TStorage]: InferYjsSharedTypeJson<TStorage[P]>;
        }) => void,
    ): () => void;

    public abstract subscribe<
        TSubject extends keyof StateNotifierSubjects<TIO, TPresence>,
    >(
        name: TSubject,
        callback: SubscriptionCallback<TIO, TPresence, TSubject>,
    ): () => void;

    public abstract undo(): void;

    public abstract updateMyPresence(presence: Partial<TPresence>): void;
}
