import type { AbstractCrdtDocFactory } from "@pluv/crdt";
import type { CrdtDocLike } from "@pluv/types";
import type { IODefs } from "./IODefs";
import type { GetInitialStorageFn } from "./types";

export interface RoomStorageConfig<T extends IODefs = IODefs> {
    docFactory: AbstractCrdtDocFactory<any, any>;
    getContext: () => Promise<T["context"]>;
    getInitialStorage: GetInitialStorageFn<T["context"]>;
    platform: T["platform"];
    room: string;
}

export interface RoomStorageDestroyResult {
    encodedState: string;
    refusedEmptyPersist: boolean;
    shouldDestroyStorage: boolean;
}

export class RoomStorage<T extends IODefs = IODefs> {
    private readonly _docFactory: AbstractCrdtDocFactory<any, any>;
    private readonly _getContext: () => Promise<T["context"]>;
    private readonly _getInitialStorage: GetInitialStorageFn<T["context"]>;
    private readonly _platform: T["platform"];
    private readonly _room: string;

    private _doc: Promise<CrdtDocLike<any, any>>;
    private _storageSeeded: boolean = false;

    constructor(config: RoomStorageConfig<T>) {
        this._docFactory = config.docFactory;
        this._getContext = config.getContext;
        this._getInitialStorage = config.getInitialStorage;
        this._platform = config.platform;
        this._room = config.room;
        this._doc = Promise.resolve(this._docFactory.getEmpty());
    }

    public get doc(): Promise<CrdtDocLike<any, any>> {
        return this._doc;
    }

    public get storageSeeded(): boolean {
        return this._storageSeeded;
    }

    public set storageSeeded(value: boolean) {
        this._storageSeeded = value;
    }

    public async destroy(): Promise<RoomStorageDestroyResult> {
        const resolvedDoc = await this._doc;
        const encodedState = resolvedDoc.getEncodedState();
        const shouldDestroyStorage = this._storageSeeded && resolvedDoc.isDirty();
        const refusedEmptyPersist = this._storageSeeded && !shouldDestroyStorage;

        this._storageSeeded = false;
        resolvedDoc.destroy();
        this._doc = Promise.resolve(this._docFactory.getEmpty());

        return { encodedState, refusedEmptyPersist, shouldDestroyStorage };
    }

    public initialize(): Promise<CrdtDocLike<any, any>> {
        this._doc = this._loadInitialDoc();

        return this._doc;
    }

    private async _loadInitialDoc(): Promise<CrdtDocLike<any, any>> {
        const doc = this._docFactory.getEmpty();

        const [encodedState, context] = await Promise.all([
            this._platform.persistence.getStorageState(this._room),
            this._getContext(),
        ]);

        if (!encodedState) {
            const loadedState = await this._getInitialStorage({
                context,
                room: this._room,
            });

            if (!!loadedState && !this._docFactory.isEmpty(loadedState)) {
                doc.applyEncodedState({ update: loadedState });
                this._storageSeeded = true;
            }
        }

        if (typeof encodedState === "string") {
            doc.applyEncodedState({ update: encodedState });

            if (!doc.isEmpty()) {
                this._storageSeeded = true;
            }
        }

        doc.rebuildStorage();

        return doc;
    }
}
