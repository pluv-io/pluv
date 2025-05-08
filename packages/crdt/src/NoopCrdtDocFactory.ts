import { AbstractCrdtDocFactory } from "./AbstractCrdtDocFactory";
import { NoopCrdtDoc } from "./NoopCrdtDoc";

export class NoopCrdtDocFactory extends AbstractCrdtDocFactory<any> {
    public getEmpty(): NoopCrdtDoc {
        return new NoopCrdtDoc();
    }

    public getFactory(initialStorage?: (() => any) | undefined): NoopCrdtDocFactory {
        return this;
    }

    public getInitialized(initialStorage?: (() => any) | undefined): NoopCrdtDoc {
        return new NoopCrdtDoc();
    }
}
