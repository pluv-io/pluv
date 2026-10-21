import { RoomFacet, type PluvRoomContext } from "@pluv/platform";
import { DurableObject } from "cloudflare:workers";

type RoomFacetSurface = Pick<RoomFacet, keyof RoomFacet>;

export class UserRoomFacet
    extends DurableObject<Record<string, unknown>>
    implements RoomFacetSurface
{
    #facet: RoomFacet | null = null;
    #opening: Promise<RoomFacet> | null = null;

    public async applyPresencePatch(
        params: Parameters<RoomFacet["applyPresencePatch"]>[0],
    ): ReturnType<RoomFacet["applyPresencePatch"]> {
        return (await this.#open()).applyPresencePatch(params);
    }

    public async applyStorageProcedure(
        params: Parameters<RoomFacet["applyStorageProcedure"]>[0],
    ): ReturnType<RoomFacet["applyStorageProcedure"]> {
        return (await this.#open()).applyStorageProcedure(params);
    }

    public async close(session: Parameters<RoomFacet["close"]>[0]): ReturnType<RoomFacet["close"]> {
        return (await this.#open()).close(session);
    }

    public async destroy(): ReturnType<RoomFacet["destroy"]> {
        return (await this.#open()).destroy();
    }

    public async dropStorageUpdates(
        frames: Parameters<RoomFacet["dropStorageUpdates"]>[0],
    ): ReturnType<RoomFacet["dropStorageUpdates"]> {
        return (await this.#open()).dropStorageUpdates(frames);
    }

    public async flushSnapshot(): ReturnType<RoomFacet["flushSnapshot"]> {
        return (await this.#open()).flushSnapshot();
    }

    public async initializeStorage(
        params: Parameters<RoomFacet["initializeStorage"]>[0],
    ): ReturnType<RoomFacet["initializeStorage"]> {
        return (await this.#open()).initializeStorage(params);
    }

    public logDebug(...data: unknown[]): null {
        if (!this.#facet) return null;

        return this.#facet.logDebug(...data);
    }

    public async message(
        params: Parameters<RoomFacet["message"]>[0],
    ): ReturnType<RoomFacet["message"]> {
        return (await this.#open()).message(params);
    }

    public async register(
        ...options: Parameters<RoomFacet["register"]>
    ): ReturnType<RoomFacet["register"]> {
        return (await this.#open()).register(...options);
    }

    public async storageDirty(): Promise<boolean> {
        return (await this.#open()).storageDirty();
    }

    public async userConnected(
        params: Parameters<RoomFacet["userConnected"]>[0],
    ): ReturnType<RoomFacet["userConnected"]> {
        return (await this.#open()).userConnected(params);
    }

    public async whenReady(): Promise<boolean> {
        return (await this.#open()).whenReady();
    }

    #open(): Promise<RoomFacet> {
        if (this.#facet) return Promise.resolve(this.#facet);

        const pending = this.#opening;

        if (pending) return pending;

        const opening = this.#load().then(
            (facet) => {
                this.#facet = facet;
                this.#opening = null;

                return facet;
            },
            (error: unknown) => {
                this.#opening = null;

                throw error;
            },
        );

        this.#opening = opening;

        return opening;
    }

    async #load(): Promise<RoomFacet> {
        const ioServer = (await import("user-server.js")).default;
        const roomId = this.ctx.id.name;

        if (!roomId) throw new Error("Room facet requires the parent id.");

        const room = ioServer.createRoom(roomId, {
            env: this.env,
            state: this.ctx as PluvRoomContext["state"],
        });

        return new RoomFacet({
            keepAlive: (promise) => {
                this.ctx.waitUntil(promise);
            },
            room,
        });
    }
}
