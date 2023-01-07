export class WebSocketUtils {
    public static makeWebSocketPair(): [client: WebSocket, server: WebSocket] {
        const { 0: client, 1: server } = new WebSocketPair();

        return [client, server];
    }
}
