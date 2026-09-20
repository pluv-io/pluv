import { schema } from "../schema/schema";
import { YjsSchema } from "./YjsSchema";

export const doc = (_value?: any): YjsSchema => {
    return schema({});
};
