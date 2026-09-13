import { schema } from "../schema/schema";
import { storage } from "../schema/storage";
import { CrdtYjsDocFactory } from "./CrdtYjsDocFactory";

export const doc = (_value?: any): CrdtYjsDocFactory => {
    return storage({ schema: schema({}) });
};
