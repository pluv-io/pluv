import { z } from "zod";
import { ZodPageInfo } from "./ZodPageInfo";

/** A page of items. */
export const ZodPage = <T extends z.ZodType>(item: T) => {
    return z.object({
        items: z.array(item),
        pageInfo: ZodPageInfo,
    });
};
