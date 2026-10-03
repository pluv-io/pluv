import type {
    Id,
    IOLike,
    OtherSubscriptionCallback,
    OthersSubscriptionCallback,
    OthersSubscriptionEvent,
    ParticipantKind,
    ParticipantKindOptions,
    ParticipantKindsOptions,
    UserInfo,
} from "@pluv/types";
import { resolveParticipantKind, resolveParticipantKinds } from "@pluv/types";
import type { Subject } from "wonka";
import { makeSubject, subscribe, TypeOfSource } from "wonka";
import { assertExhaustive } from "./utils/assertExhaustive";

export interface OtherSubjectParams {
    id: string;
    kind: ParticipantKind;
}

export class UsersNotifier<TIO extends IOLike, TPresence extends Record<string, any> = {}> {
    public readonly others = makeSubject<{
        others: readonly Id<UserInfo<TIO, TPresence>>[];
        event: OthersSubscriptionEvent<TIO, TPresence>;
    }>();

    private readonly _otherSubjects = {
        operator: new Map<string, Subject<Id<UserInfo<TIO, TPresence>> | null>>(),
        user: new Map<string, Subject<Id<UserInfo<TIO, TPresence>> | null>>(),
    };

    public clear(): void {
        this._subjectsForKind("user").forEach((subject) => {
            subject.next(null);
        });
        this._subjectsForKind("operator").forEach((subject) => {
            subject.next(null);
        });
        this._subjectsForKind("user").clear();
        this._subjectsForKind("operator").clear();
    }

    public delete(params: OtherSubjectParams): void {
        const { id, kind } = params;
        const subjects = this._subjectsForKind(kind);
        const subject = subjects.get(id);

        if (!subject) return;

        subject.next(null);
        subjects.delete(id);
    }

    public other(params: OtherSubjectParams): Subject<Id<UserInfo<TIO, TPresence>> | null> {
        const { id, kind } = params;
        const subjects = this._subjectsForKind(kind);
        const subject = subjects.get(id);

        if (subject) return subject;

        const created = makeSubject<Id<UserInfo<TIO, TPresence>> | null>();

        subjects.set(id, created);

        return created;
    }

    public subscribeOther(
        id: string,
        callback: OtherSubscriptionCallback<TIO, TPresence>,
        options?: ParticipantKindOptions,
    ): () => void {
        const kind = resolveParticipantKind(options?.kind);
        const subscription = subscribe(callback)(this.other({ id, kind }).source);

        return () => {
            subscription.unsubscribe();
        };
    }

    public subscribeOthers(
        callback: OthersSubscriptionCallback<TIO, TPresence>,
        options?: ParticipantKindsOptions,
    ): () => void {
        const kinds = resolveParticipantKinds(options?.kinds);
        const subscription = subscribe<TypeOfSource<typeof this.others.source>>(
            ({ others, event }) => {
                switch (event.kind) {
                    case "clear":
                    case "sync":
                        break;
                    case "enter":
                    case "leave":
                    case "update":
                        if (!kinds.includes(event.user.kind)) return;
                        break;
                    default:
                        assertExhaustive(event);
                }

                callback(others, event);
            },
        )(this.others.source);

        return () => {
            subscription.unsubscribe();
        };
    }

    private _subjectsForKind(
        kind: ParticipantKind,
    ): Map<string, Subject<Id<UserInfo<TIO, TPresence>> | null>> {
        switch (kind) {
            case "operator":
                return this._otherSubjects.operator;
            case "user":
                return this._otherSubjects.user;
            default:
                return assertExhaustive(kind);
        }
    }
}
