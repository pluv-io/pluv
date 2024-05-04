import type { Id, MaybePromise, Spread } from "@pluv/types";
import { match } from "path-to-regexp";

type PathParamRecord<TParamName extends string, TParamValue extends string | string[] = string> = {
    [key in `${TParamName}`]: TParamValue;
};

export type PathParams<T extends string> = T extends string
    ? T extends `/:${infer IFullParam}`
        ? IFullParam extends `${infer IParamName}/${infer IRestParam}`
            ? Spread<[PathParamRecord<IParamName>, PathParams<`/${IRestParam}`>]>
            : IFullParam extends `${infer IParamName}${"+" | "*"}`
              ? PathParamRecord<IParamName, string[]>
              : PathParamRecord<IFullParam>
        : T extends `/${infer IFullPath}`
          ? IFullPath extends `${string}/${infer IRestParam}`
              ? PathParams<`/${IRestParam}`>
              : {}
          : {}
    : `Error: Could not resolve path: ${T}`;

interface RouterPathHandlerHelpers<TContext> {
    context: TContext;
    origin: string;
    query: ParsedUrlQuery;
    request: Request;
}

type RouterPathHandler<TContext, T extends PathParamRecord<string, any>> = (
    params: Id<T>,
    helpers: RouterPathHandlerHelpers<TContext>,
) => MaybePromise<Response | void>;

export type ParsedUrlQuery = Record<string, string | string[] | undefined>;

export type RouterMethod =
    | "all"
    | "connect"
    | "delete"
    | "get"
    | "head"
    | "options"
    | "patch"
    | "post"
    | "put"
    | "trace";

type RouterPathTuple<
    TContext,
    TMethod extends RouterMethod,
    TPathName extends string,
    TPathParams extends PathParams<TPathName>,
> = readonly [method: TMethod, path: TPathName, handler: RouterPathHandler<TContext, Id<TPathParams>>];

type RouterPaths<
    TContext,
    TMethod extends RouterMethod,
    TPathName extends string,
    TPathParams extends PathParams<TPathName>,
> = readonly RouterPathTuple<TContext, TMethod, TPathName, TPathParams>[];

export interface RouterConfigOptions<TContext> {
    context: TContext;
}

export interface RouterOptions<TContext, TPaths extends RouterPaths<TContext, any, string, any>> {
    paths?: TPaths;
}

export class Router<TContext, TPaths extends RouterPaths<TContext, any, string, any> = []> {
    private _config: RouterConfigOptions<TContext> | null = null;

    public paths: TPaths;

    constructor(options: RouterOptions<TContext, TPaths> = {}) {
        this.paths = options.paths ?? ([] as any);
    }

    public async match(request: Request): Promise<Response> {
        if (!this._config) {
            throw new Error('Must call "setConfig" before matching a new request.');
        }

        const url = new URL(request.url);

        const matchedPath = this.paths.find(([method, pattern]) => {
            const isMethodMatch = this._compareMethods(request.method, method) || method === "all";

            return isMethodMatch && !!match(pattern)(url.pathname);
        });

        if (!matchedPath) return new Response("Not found", { status: 404 });

        const [, matchedPattern, handler] = matchedPath;

        const matched = match(matchedPattern)(url.pathname);

        if (!matched) return new Response("Not found", { status: 404 });

        const params = matched.params;
        const query = this._getQuery(request);

        return (
            (await handler(params, {
                context: this._config.context,
                origin: url.origin,
                query,
                request,
            })) ?? new Response("OK", { status: 200 })
        );
    }

    public static merge<
        TContextStatic,
        TPathsStatic1 extends RouterPaths<TContextStatic, any, string, any>,
        TPathsStatic2 extends RouterPaths<TContextStatic, any, string, any>,
    >(
        router1: Router<TContextStatic, TPathsStatic1>,
        router2: Router<TContextStatic, TPathsStatic2>,
    ): Router<TContextStatic, [...TPathsStatic1, ...TPathsStatic2]> {
        const paths1 = router1.paths;
        const paths2 = router2.paths;

        return new Router({ paths: [...paths1, ...paths2] });
    }

    public path<TMethod extends RouterMethod, TPath extends string>(
        method: TMethod,
        pattern: TPath,
        handler: RouterPathHandler<TContext, Id<PathParams<TPath>>>,
    ): Router<TContext, [...TPaths, ...RouterPaths<TContext, TMethod, TPath, PathParams<TPath>>]> {
        const newPath = [[method, pattern, handler]] as RouterPaths<TContext, TMethod, TPath, PathParams<TPath>>;

        return Router.merge(this, new Router({ paths: newPath }));
    }

    public setConfig(options: RouterConfigOptions<TContext>): Router<TContext, TPaths> {
        this._config = options;

        return this;
    }

    private _compareMethods(method1: string, method2: string): boolean {
        return method1.toLowerCase() === method2.toLowerCase();
    }

    private _getQuery(request: Request): ParsedUrlQuery {
        const url = new URL(request.url);

        return Array.from(url.searchParams.entries()).reduce((acc, [key, value]) => {
            if (typeof value === "undefined") return acc;

            const previous = acc[key];
            const decoded = decodeURIComponent(value);

            return {
                ...acc,
                [key]: Array.isArray(previous)
                    ? [...previous, decoded]
                    : typeof previous !== "undefined"
                      ? [previous, decoded]
                      : decoded,
            };
        }, {} as ParsedUrlQuery);
    }
}
