import { makeSubject, subscribe, TypeOfSource } from "wonka";

export class ListenerManager {
    public subjects = {
        close: makeSubject<CloseEvent>(),
        error: makeSubject<Event>(),
        message: makeSubject<MessageEvent<any>>(),
        open: makeSubject<Event>(),
    };

    public subscribe<TKind extends keyof typeof this.subjects>(
        kind: TKind,
        callback: (event: TypeOfSource<(typeof this.subjects)[TKind]["source"]>) => void,
    ): () => void {
        const source = this.subjects[kind]?.source;

        if (!source) return () => undefined;

        return subscribe(callback)(source as any).unsubscribe;
    }
}
