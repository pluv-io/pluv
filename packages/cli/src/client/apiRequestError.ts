import { ZodApiError } from "../schemas";
import type { RequestError } from "./procedure";

/** Status-aware CLI API error text. A 401 tells the user to log in again. */
export const apiRequestError =
    (fallback: string): RequestError =>
    (status, body) => {
        if (status === 401) return "The saved login expired. Run pluv login.";

        const parsed = ZodApiError.safeParse(body);

        return parsed.success ? parsed.data.message : fallback;
    };
