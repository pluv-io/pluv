import { schema } from "../schema/schema";
import { storage } from "../schema/storage";
import { CrdtLoroDocFactory } from "./CrdtLoroDocFactory";

export const doc = (_value?: any): CrdtLoroDocFactory => {
    return storage({ schema: schema({}) });
};
