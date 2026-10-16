declare module "*.bundle.txt" {
    const source: string;

    export default source;
}

declare module "user-server.js" {
    import type { SessionRoom } from "@pluv/io";
    import type { PluvRoomContext } from "@pluv/platform";

    const ioServer: {
        createRoom: (room: string, context: PluvRoomContext) => SessionRoom<any>;
    };

    export default ioServer;
}
