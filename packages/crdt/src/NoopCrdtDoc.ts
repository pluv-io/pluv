import {
    CrdtDocLike,
    DocApplyEncodedStateParams,
    DocBatchApplyEncodedStateParams,
    DocSubscribeCallbackParams,
} from "@pluv/types";

export class NoopCrdtDoc implements CrdtDocLike<any, any> {
    public value: any = null;

    public applyEncodedState(params: DocApplyEncodedStateParams): this {
        return this;
    }

    public batchApplyEncodedState(params: DocBatchApplyEncodedStateParams): this {
        return this;
    }

    public canRedo(): boolean {
        return false;
    }

    public canUndo(): boolean {
        return false;
    }

    public destroy(): void {
        return;
    }

    public get(key?: undefined): {};
    public get<TKey extends never>(key: TKey): {}[TKey];
    public get(key?: string): {} | undefined {
        return typeof key === "string" ? undefined : {};
    }

    public getEncodedState(): string {
        return "";
    }

    public isEmpty(): boolean {
        return true;
    }

    public rebuildStorage(): this {
        return this;
    }

    public redo(): this {
        return this;
    }

    public subscribe(listener: (params: DocSubscribeCallbackParams<any, any>) => void): () => void {
        return () => undefined;
    }

    public toJson(): any {
        return {};
    }

    public track(): this {
        return this;
    }

    public transact(fn: () => void, origin?: string | undefined): this {
        fn();

        return this;
    }

    public undo(): this {
        return this;
    }
}
