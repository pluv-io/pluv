import { schema } from "../schema/schema";
import { LoroSchema } from "./LoroSchema";

export const doc = (_value?: any): LoroSchema => {
    return schema({});
};
