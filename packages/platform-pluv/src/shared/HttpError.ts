import type { ContentfulStatusCode } from "hono/utils/http-status";

export class HttpError extends Error {
    readonly status: ContentfulStatusCode;

    constructor(message: string, status: ContentfulStatusCode) {
        super(message);

        this.status = status;
    }
}
