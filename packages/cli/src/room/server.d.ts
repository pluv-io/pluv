declare module "server.js" {
    import type { IORoom } from "@pluv/io";
    import type { PluvRoomContext } from "@pluv/platform";

    const ioServer: {
        createRoom: (room: string, context: PluvRoomContext) => IORoom<any>;
        createToken: (params: {
            room: string;
            user: { id: string; name: string };
        }) => Promise<string>;
    };

    export default ioServer;
}
