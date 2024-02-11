export interface LocationLike {
    origin: string;
}

export interface RequestLike {
    url: string;
}

export type RelativeRequestLike = LocationLike | RequestLike;

export class UrlUtils {
    public static ensureHttp(url: string): string {
        return `http://${UrlUtils.stripProtocol(url)}`;
    }

    public static ensureHttps(url: string): string {
        return `https://${UrlUtils.stripProtocol(url)}`;
    }

    public static ensureWs(url: string): string {
        return `ws://${UrlUtils.stripProtocol(url)}`;
    }

    public static ensureWss(url: string): string {
        return `wss://${UrlUtils.stripProtocol(url)}`;
    }

    public static isValid(url: string): boolean {
        try {
            const _url = new URL(url);

            return _url.protocol === "http:" || _url.protocol === "https:";
        } catch {
            return false;
        }
    }

    public static preferHttps(url: string): string {
        return /^(https?|wss?):\/\/localhost/.test(url)
            ? UrlUtils.ensureHttp(url)
            : UrlUtils.ensureHttps(url);
    }

    public static preferWss(url: string): string {
        return /^(https?|wss?):\/\/localhost/.test(url)
            ? UrlUtils.ensureWs(url)
            : UrlUtils.ensureWss(url);
    }

    public static relative(req: RelativeRequestLike, path: string): string {
        const origin: string = UrlUtils._isLocationLike(req)
            ? req.origin
            : UrlUtils._isRequestLike(req)
              ? req.url
              : "";

        if (!origin) {
            return path;
        }

        const url = new URL(origin);

        url.pathname = `/${path.replace(/^\//, "")}`;

        return url.toString();
    }

    public static stripProtocol(url: string): string {
        return url.replace(/^(wss?|https?):\/\//, "");
    }

    private static _isLocationLike(req: any): req is LocationLike {
        return typeof req.origin === "string";
    }

    private static _isRequestLike(req: any): req is RequestLike {
        return typeof req.url === "string";
    }
}
