import type {
    DocApplyEncodedStateParams,
    DocBatchApplyEncodedStateParams,
    DocSubscribeCallbackParams,
} from "./AbstractCrdtDoc";
import { AbstractCrdtDoc } from "./AbstractCrdtDoc";

export class NoopCrdtDoc extends AbstractCrdtDoc<any> {
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

    public redo(): this {
        return this;
    }

    public subscribe(listener: (params: DocSubscribeCallbackParams<{}>) => void): () => void {
        return () => undefined;
    }

    public toJson(): {} {
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
