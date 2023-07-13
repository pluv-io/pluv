import { WebSocketUtils } from "./WebSocketUtils";

export class RequestUtils {
    public static getRequestIp(request: Request): string {
        const clientIp = request.headers.get("CF-Connecting-IP");

        if (!clientIp) throw new Error("Could not get connecting ip");

        return clientIp;
    }

    public static async handleErrors(
        request: Request,
        event: (request: Request) => Promise<Response>,
    ): Promise<Response> {
        try {
            return await event(request);
        } catch (err) {
            if (!(err instanceof Error)) {
                return new Response("Undetermined Error", { status: 500 });
            }

            /**
             * !HACK
             * @description Annoyingly, if we return an HTTP error in response to a WebSocket
             * request, Chrome devtools won't show us the response body! So... let's send a
             * WebSocket response with an error frame instead
             * @author David Lee
             * @date July 31, 2022
             */
            const [client, server] = WebSocketUtils.makeWebSocketPair();

            server.accept();
            server.send(JSON.stringify({ error: (err as Error).stack }));
            server.close(1011, "Uncaught exception during session setup");

            return new Response(null, { status: 101, webSocket: client });
        }
    }

    public static isWebSocketRequest(request: Request): boolean {
        return request.headers.get("Upgrade") === "websocket";
    }
}
