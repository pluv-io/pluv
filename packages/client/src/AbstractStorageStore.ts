export abstract class AbstractStorageStore {
    public room: string;

    constructor(room: string) {
        this.room = room;
    }

    public abstract addUpdate(update: string): Promise<void>;

    public abstract destroy(): Promise<void>;

    public abstract flatten(encodedState: string): Promise<void>;

    public abstract getShouldFlatten(): Promise<boolean>;

    public abstract getUpdates(start?: number): Promise<readonly string[]>;

    public abstract initialize(): Promise<void>;
}
