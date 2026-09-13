import { AbstractCrdtDocFactory } from "./AbstractCrdtDocFactory";
import { NoopCrdtDoc } from "./NoopCrdtDoc";

export class NoopCrdtDocFactory extends AbstractCrdtDocFactory<any, {}, {}, {}> {
    public getEmpty(): NoopCrdtDoc {
        return new NoopCrdtDoc();
    }

    public getFactory(_seed?: {}): NoopCrdtDocFactory {
        return this;
    }

    public getInitialized(_seed?: {}): NoopCrdtDoc {
        return new NoopCrdtDoc();
    }
}
