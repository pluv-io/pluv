import { AbstractStorageStore } from "./AbstractStorageStore";

export class StorageStore extends AbstractStorageStore {
    public addUpdate() {
        return Promise.resolve();
    }

    public applyUpdates() {
        return Promise.resolve();
    }

    public destroy() {
        return Promise.resolve();
    }

    public flatten() {
        return Promise.resolve();
    }

    public getShouldFlatten() {
        return Promise.resolve(false);
    }

    public getUpdates() {
        return Promise.resolve([]);
    }

    public initialize() {
        return Promise.resolve();
    }
}
