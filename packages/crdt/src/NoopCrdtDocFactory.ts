import { AbstractCrdtDocFactory } from "./AbstractCrdtDocFactory";
import { NoopCrdtDoc } from "./NoopCrdtDoc";

export class NoopCrdtDocFactory extends AbstractCrdtDocFactory<any> {
    public getEmpty(): NoopCrdtDoc {
        return new NoopCrdtDoc();
    }

    public getFactory(initialStorage?: (() => {}) | undefined): NoopCrdtDocFactory {
        return this;
    }

    public getFresh(): NoopCrdtDoc {
        return new NoopCrdtDoc();
    }

    public getInitialized(initialStorage?: (() => {}) | undefined): NoopCrdtDoc {
        return new NoopCrdtDoc();
    }
}
