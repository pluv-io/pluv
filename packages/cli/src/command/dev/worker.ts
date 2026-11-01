import type { WorkerLoader } from "@pluv/platform/load-user-facet";
import { COMPATIBILITY_DATE, createRoomSupervisor } from "pluv/supervisor";
import facetSource from "pluv-dev/facet-source";
import serverSource from "pluv-dev/server-source";

declare const __PLUV_DEV_ENV: Record<string, string>;
declare const __PLUV_DEV_VERSION: string;

type Env = {
    LOADER: WorkerLoader;
    rooms: DurableObjectNamespace;
};

const roomEnv = __PLUV_DEV_ENV;

const PlatformRoom = createRoomSupervisor<Env>({
    version: __PLUV_DEV_VERSION,
    code: () => ({
        compatibilityDate: COMPATIBILITY_DATE,
        env: roomEnv,
        mainModule: "facet.js",
        modules: {
            "facet.js": facetSource,
            "server.js": serverSource,
        },
    }),
});

export class RoomSupervisor extends PlatformRoom {}

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);
        const match = url.pathname.match(/^\/api\/pluv\/room\/([^/]+)$/);

        if (!match?.[1]) return new Response("Not found", { status: 404 });

        const id = env.rooms.idFromName(decodeURIComponent(match[1]));

        return env.rooms.get(id).fetch(request);
    },
};
