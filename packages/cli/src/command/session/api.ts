import { z } from "zod";
import { apiBase, authBase, type ServiceUrls } from "./endpoints";
import { readSessionToken } from "./sessionToken";

declare const unsetOutput: unique symbol;

type UnsetOutput = typeof unsetOutput;

type Method = "GET" | "POST";

type RequestError = string | ((status: number, body: unknown) => string);

type SearchValue = string | number | boolean | null | undefined;

type Auth =
    | { kind: "none" }
    | { kind: "token"; token: string }
    | { kind: "saved"; cwd: string; urls?: ServiceUrls; token?: string };

type State<TOutput> = {
    baseUrl: string;
    auth: Auth;
    method: Method;
    path: string;
    searchParams: Record<string, string>;
    headers: Record<string, string>;
    body: { schema: z.ZodType; value: unknown } | null;
    output: z.ZodType<TOutput> | null;
    expect: number | null;
    error?: RequestError;
    invalid?: string;
};

const messageFor = (error: RequestError | undefined, status: number, body: unknown): string => {
    if (typeof error === "function") return error(status, body);

    return error ?? "Request failed.";
};

const ZodSessionJwt = z.object({
    jwt: z.string().min(1),
});

/** Exchange the saved session token for a 60-second JWT. Does not renew the session. */
const exchangeSessionJwt = async (
    token: string,
    urls: ServiceUrls | undefined,
): Promise<string> => {
    const body = await new ApiClient(authBase(urls), { kind: "token", token })
        .post("/api/auth/session/jwt")
        .output(ZodSessionJwt)
        .error("The saved login expired. Run pluv login.")
        .send();

    return body.jwt;
};

const originFor = (path: string, urls?: ServiceUrls): string => {
    return path.startsWith("/api/auth/") ? authBase(urls) : apiBase(urls);
};

const resolveBearer = async (auth: Auth): Promise<string | undefined> => {
    if (auth.kind === "none") return undefined;
    if (auth.kind === "token") return auth.token;

    const token = auth.token ?? (await readSessionToken(auth.cwd));

    if (!token) return undefined;

    return exchangeSessionJwt(token, auth.urls);
};

const mergeSearchParams = (
    current: Record<string, string>,
    next: Record<string, SearchValue>,
): Record<string, string> => {
    const merged = { ...current };

    for (const [key, value] of Object.entries(next)) {
        if (value === undefined || value === null) continue;

        merged[key] = String(value);
    }

    return merged;
};

export class ApiRequest<TOutput = UnsetOutput> {
    private readonly state: State<TOutput>;

    public constructor(state: State<TOutput>) {
        this.state = state;
    }

    /** Sends this bearer token instead of the saved session. */
    public bearer(token: string): ApiRequest<TOutput> {
        return this.clone({ auth: { kind: "token", token } });
    }

    /** Merges query parameters. A later call overwrites a repeated key. */
    public searchParams(params: Record<string, SearchValue>): ApiRequest<TOutput> {
        return this.clone({ searchParams: mergeSearchParams(this.state.searchParams, params) });
    }

    /** Merges headers. These overwrite `authorization` and a JSON content type. */
    public headers(headers: Record<string, string>): ApiRequest<TOutput> {
        return this.clone({ headers: { ...this.state.headers, ...headers } });
    }

    /** Parses `value` and sends it as JSON. A second call throws. */
    public body<S extends z.ZodType>(schema: S, value: z.input<S>): ApiRequest<TOutput> {
        if (this.state.body) throw new Error("Body was already defined for this request.");

        return this.clone({ body: { schema, value } });
    }

    /** Parses the response body. A second call throws. */
    public output<T>(schema: z.ZodType<T>): ApiRequest<T> {
        if (this.state.output) throw new Error("Output was already defined for this request.");

        return this.clone<T>({ output: schema });
    }

    /** Succeeds only at this status. A second call throws. */
    public expect(status: number): ApiRequest<TOutput> {
        if (this.state.expect !== null) {
            throw new Error("Status was already defined for this request.");
        }

        return this.clone({ expect: status });
    }

    /** Message used when the response status fails. A second call throws. */
    public error(error: RequestError): ApiRequest<TOutput> {
        if (this.state.error !== undefined) {
            throw new Error("Error was already defined for this request.");
        }

        return this.clone({ error });
    }

    /** Message used when the response body does not match `output`. A second call throws. */
    public invalid(message: string): ApiRequest<TOutput> {
        if (this.state.invalid !== undefined) {
            throw new Error("Invalid output was already defined for this request.");
        }

        return this.clone({ invalid: message });
    }

    public async send(): Promise<[TOutput] extends [UnsetOutput] ? void : TOutput> {
        if (this.state.method === "GET" && this.state.body) {
            throw new Error("A GET request cannot include a body.");
        }

        const url = new URL(this.state.path, this.state.baseUrl);

        for (const [key, value] of Object.entries(this.state.searchParams)) {
            url.searchParams.set(key, value);
        }

        const headers = new Headers();
        const token = await resolveBearer(this.state.auth);

        if (token) headers.set("authorization", `Bearer ${token}`);

        let body: string | undefined;

        if (this.state.body) {
            const parsed = this.state.body.schema.safeParse(this.state.body.value);

            if (!parsed.success) throw new Error("Invalid request body.");

            headers.set("content-type", "application/json");
            body = JSON.stringify(parsed.data);
        }

        for (const [key, value] of Object.entries(this.state.headers)) {
            headers.set(key, value);
        }

        const response = await fetch(url, { method: this.state.method, headers, body });
        const payload: unknown = await response.json().catch(() => null);
        const failed =
            this.state.expect !== null
                ? response.status !== this.state.expect
                : response.status < 200 || response.status >= 300;

        if (failed) {
            throw new Error(messageFor(this.state.error, response.status, payload));
        }

        if (!this.state.output)
            return undefined as [TOutput] extends [UnsetOutput] ? void : TOutput;

        const parsed = this.state.output.safeParse(payload);

        if (!parsed.success) {
            throw new Error(
                this.state.invalid ?? messageFor(this.state.error, response.status, payload),
            );
        }

        return parsed.data as [TOutput] extends [UnsetOutput] ? void : TOutput;
    }

    private clone<T = TOutput>(patch: {
        auth?: Auth;
        searchParams?: Record<string, string>;
        headers?: Record<string, string>;
        body?: { schema: z.ZodType; value: unknown } | null;
        output?: z.ZodType<T> | null;
        expect?: number | null;
        error?: RequestError;
        invalid?: string;
    }): ApiRequest<T> {
        return new ApiRequest<T>({
            baseUrl: this.state.baseUrl,
            auth: patch.auth ?? this.state.auth,
            method: this.state.method,
            path: this.state.path,
            searchParams: patch.searchParams ?? this.state.searchParams,
            headers: patch.headers ?? this.state.headers,
            body: patch.body === undefined ? this.state.body : patch.body,
            output: (patch.output === undefined
                ? this.state.output
                : patch.output) as z.ZodType<T> | null,
            expect: patch.expect === undefined ? this.state.expect : patch.expect,
            error: patch.error ?? this.state.error,
            invalid: patch.invalid ?? this.state.invalid,
        });
    }
}

class ApiClient {
    public constructor(
        private readonly baseUrl: string | undefined,
        private readonly auth: Auth = { kind: "none" },
        private readonly urls?: ServiceUrls,
    ) {}

    /** Sends this bearer token instead of the saved session. */
    public bearer(token: string): ApiClient {
        return new ApiClient(this.baseUrl, { kind: "token", token }, this.urls);
    }

    public get(path: string): ApiRequest {
        return this.request("GET", path);
    }

    public post(path: string): ApiRequest {
        return this.request("POST", path);
    }

    private request(method: Method, path: string): ApiRequest {
        return new ApiRequest({
            baseUrl: this.baseUrl ?? originFor(path, this.urls),
            auth: this.auth,
            method,
            path,
            searchParams: {},
            headers: {},
            body: null,
            output: null,
            expect: null,
        });
    }
}

export const api = {
    /** A fixed service URL, with no saved session attached. */
    base(url: string): ApiClient {
        return new ApiClient(url);
    },
    /** Attaches the saved CLI session when one exists. `token` is that session. */
    client(options: { cwd: string; urls?: ServiceUrls; token?: string }): ApiClient {
        return new ApiClient(undefined, { kind: "saved", ...options }, options.urls);
    },
};
