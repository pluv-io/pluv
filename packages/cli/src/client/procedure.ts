import type { z } from "zod";
import { resolveServiceUrls } from "../config/serviceUrls";
import { readApiToken, readSessionToken } from "../session/sessionToken";
import { api, type ApiRequest, type OutputOptions } from "./api";

export type RequestError = string | ((status: number, body: unknown) => string);

export type SearchValue = string | number | boolean | null | undefined;

/** How the transport attaches credentials. */
export type ProcedureAuth = "bearer" | "none" | "session";

export type InvokeOptions = {
    searchParams?: Record<string, SearchValue>;
    /** Wraps or replaces the procedure error for this call. */
    error?: RequestError;
};

export type ProcedureDef<TInput = void, TWireOutput = void, TOutput = TWireOutput> = {
    method: "GET" | "POST";
    path: string | ((input: TInput) => string);
    input?: z.ZodType;
    output?: z.ZodType<TWireOutput>;
    /** Maps caller input to the JSON request body when `input` schema is set. */
    resolveInput?: (input: TInput) => unknown;
    /** Maps a parsed wire response to the value callers receive. */
    resolve?: (wire: TWireOutput, input: TInput) => TOutput;
    error: RequestError;
    outputError?: RequestError;
    expect?: number;
    auth: ProcedureAuth;
};

export type CliProcedure<TInput = void, TWireOutput = void, TOutput = TWireOutput> = ProcedureDef<
    TInput,
    TWireOutput,
    TOutput
> & {
    invoke(input?: TInput, options?: InvokeOptions): Promise<TOutput>;
};

const resolveClient = async (auth: ProcedureAuth) => {
    const urls = resolveServiceUrls();

    if (auth === "none") return api.base(urls.apiUrl);

    /** Raw CLI session token for `/api/auth/session/jwt` only — not the account API token. */
    if (auth === "bearer") {
        const token = await readSessionToken(process.cwd());

        if (!token) throw new Error("Bearer token required.");

        return api.base(urls.apiUrl).bearer(token);
    }

    const apiToken = readApiToken();

    if (apiToken) return api.base(urls.apiUrl).bearer(apiToken);

    return api.client({ cwd: process.cwd(), urls });
};

const execute = async <TInput, TWireOutput, TOutput>(
    def: ProcedureDef<TInput, TWireOutput, TOutput>,
    input?: TInput,
    options?: InvokeOptions,
): Promise<TOutput> => {
    const resolvedInput = input ?? (undefined as TInput);
    const path = typeof def.path === "function" ? def.path(resolvedInput) : def.path;
    const client = await resolveClient(def.auth);
    let request: ApiRequest = def.method === "GET" ? client.get(path) : client.post(path);

    if (options?.searchParams) {
        request = request.searchParams(options.searchParams);
    }

    if (def.input) {
        const body = def.resolveInput ? def.resolveInput(resolvedInput) : resolvedInput;

        request = request.body(def.input, body as never);
    }

    if (def.output) {
        request = request.output(
            def.output,
            def.outputError === undefined ? undefined : { error: def.outputError },
        ) as ApiRequest;
    }

    request = request.error(options?.error ?? def.error);
    if (def.expect !== undefined) request = request.expect(def.expect);

    const wire = (await request.send()) as TWireOutput;

    if (def.resolve) return def.resolve(wire, resolvedInput);

    return wire as unknown as TOutput;
};

export const defineProcedure = <TInput = void, TWireOutput = void, TOutput = TWireOutput>(
    def: ProcedureDef<TInput, TWireOutput, TOutput>,
): CliProcedure<TInput, TWireOutput, TOutput> => ({
    ...def,
    invoke: (input, options) => execute(def, input, options),
});

type BuilderState<TInput, TWireOutput, TOutput> = {
    method?: ProcedureDef<TInput, TWireOutput, TOutput>["method"];
    path?: ProcedureDef<TInput, TWireOutput, TOutput>["path"];
    input?: z.ZodType;
    output?: z.ZodType<TWireOutput>;
    resolveInput?: ProcedureDef<TInput, TWireOutput, TOutput>["resolveInput"];
    resolve?: ProcedureDef<TInput, TWireOutput, TOutput>["resolve"];
    error?: RequestError;
    outputError?: RequestError;
    expect?: number;
    auth?: ProcedureAuth;
};

class ProcedureBuilder<TInput = void, TWireOutput = void, TOutput = TWireOutput> {
    public constructor(private readonly state: BuilderState<TInput, TWireOutput, TOutput>) {}

    public get(
        path: string | ((input: TInput) => string),
    ): ProcedureBuilder<TInput, TWireOutput, TOutput> {
        return new ProcedureBuilder({ ...this.state, method: "GET", path });
    }

    public post(
        path: string | ((input: TInput) => string),
    ): ProcedureBuilder<TInput, TWireOutput, TOutput> {
        return new ProcedureBuilder({ ...this.state, method: "POST", path });
    }

    public session(): ProcedureBuilder<TInput, TWireOutput, TOutput> {
        return new ProcedureBuilder({ ...this.state, auth: "session" });
    }

    public bearer(): ProcedureBuilder<TInput, TWireOutput, TOutput> {
        return new ProcedureBuilder({ ...this.state, auth: "bearer" });
    }

    public unauthenticated(): ProcedureBuilder<TInput, TWireOutput, TOutput> {
        return new ProcedureBuilder({ ...this.state, auth: "none" });
    }

    public error(error: RequestError): ProcedureBuilder<TInput, TWireOutput, TOutput> {
        return new ProcedureBuilder({ ...this.state, error });
    }

    public expect(status: number): ProcedureBuilder<TInput, TWireOutput, TOutput> {
        return new ProcedureBuilder({ ...this.state, expect: status });
    }

    /** Succeeds only at 204 with no parsed response body. */
    public noContent(): ProcedureBuilder<TInput, TWireOutput, TOutput> {
        return this.expect(204);
    }

    public input<TNext>(schema: z.ZodType<TNext>): ProcedureBuilder<TNext, TWireOutput, TOutput> {
        return new ProcedureBuilder<TNext, TWireOutput, TOutput>({
            ...(this.state as unknown as BuilderState<TNext, TWireOutput, TOutput>),
            input: schema,
        });
    }

    public output<TNext>(
        schema: z.ZodType<TNext>,
        options?: OutputOptions,
    ): ProcedureBuilder<TInput, TNext, TNext> {
        return new ProcedureBuilder<TInput, TNext, TNext>({
            ...(this.state as unknown as BuilderState<TInput, TNext, TNext>),
            output: schema,
            outputError: options?.error,
        });
    }

    public resolveInput(
        resolveInput: (input: TInput) => unknown,
    ): ProcedureBuilder<TInput, TWireOutput, TOutput> {
        return new ProcedureBuilder({ ...this.state, resolveInput });
    }

    public resolve<TNext>(
        resolve: (wire: TWireOutput, input: TInput) => TNext,
    ): ProcedureBuilder<TInput, TWireOutput, TNext> {
        return new ProcedureBuilder<TInput, TWireOutput, TNext>({ ...this.state, resolve });
    }

    public build(): CliProcedure<TInput, TWireOutput, TOutput> {
        const { method, path, auth, error } = this.state;

        if (!method) throw new Error("Procedure method is required.");
        if (path === undefined) throw new Error("Procedure path is required.");
        if (!auth) throw new Error("Procedure auth is required.");
        if (error === undefined) throw new Error("Procedure error is required.");

        return defineProcedure<TInput, TWireOutput, TOutput>({
            method,
            path,
            auth,
            error,
            input: this.state.input,
            output: this.state.output,
            resolveInput: this.state.resolveInput,
            resolve: this.state.resolve,
            outputError: this.state.outputError,
            expect: this.state.expect,
        });
    }
}

export const procedure = <TInput = void>(): ProcedureBuilder<TInput> => new ProcedureBuilder({});

/** Caller input for `procedure.invoke` (or the bound RPC function’s first argument). */
export type InferProcedureInput<P> = P extends CliProcedure<infer I, any, any> ? I : never;

/** Parsed wire response shape before an optional `.resolve()`. */
export type InferProcedureWireOutput<P> = P extends CliProcedure<any, infer W, any> ? W : never;

/** Value returned from `procedure.invoke` after an optional `.resolve()`. */
export type InferProcedureOutput<P> = P extends CliProcedure<any, any, infer O> ? O : never;

/** Input and output types for each procedure on a router. */
export type InferRouterInputs<T extends Record<string, CliProcedure<any, any, any>>> = {
    [K in keyof T]: InferProcedureInput<T[K]>;
};

export type InferRouterOutputs<T extends Record<string, CliProcedure<any, any, any>>> = {
    [K in keyof T]: InferProcedureOutput<T[K]>;
};

export type BoundProcedure<I, O> = [I] extends [void]
    ? (options?: InvokeOptions) => Promise<O>
    : (input: I, options?: InvokeOptions) => Promise<O>;

export type BoundRouter<T extends Record<string, CliProcedure<any, any, any>>> = {
    [K in keyof T]: BoundProcedure<InferProcedureInput<T[K]>, InferProcedureOutput<T[K]>>;
};

const procedureNeedsInput = (proc: CliProcedure<any, any, any>): boolean =>
    proc.input !== undefined || typeof proc.path === "function";

/** Binds every procedure in a router for `cliRpc`. */
export const bindRouter = <T extends Record<string, CliProcedure<any, any, any>>>(
    router: T,
): BoundRouter<T> => {
    const bound = {} as BoundRouter<T>;

    for (const key of Object.keys(router) as Array<keyof T>) {
        const proc = router[key];

        if (procedureNeedsInput(proc)) {
            bound[key] = ((input: never, options?: InvokeOptions) =>
                proc.invoke(input, options)) as BoundRouter<T>[typeof key];
            continue;
        }

        bound[key] = ((options?: InvokeOptions) =>
            proc.invoke(undefined, options)) as BoundRouter<T>[typeof key];
    }

    return bound;
};
