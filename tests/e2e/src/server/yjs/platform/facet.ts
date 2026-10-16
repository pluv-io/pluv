import { RoomFacet, type PluvRoomContext, type PluvSocket } from "@pluv/platform";
import { DurableObject } from "cloudflare:workers";

export class UserRoomFacet extends DurableObject<Record<string, unknown>> {
    #facet: RoomFacet | null = null;
    #sessions: PluvSocket[] = [];

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

    public async flushCheckpoint(): ReturnType<RoomFacet["flushCheckpoint"]> {
        return (await this.#open()).flushCheckpoint();
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

    async #open(): Promise<RoomFacet> {
        if (this.#facet) return this.#facet;

        const ioServer = (await import("user-server.js")).default;
        const roomId = this.ctx.id.name;

        if (!roomId) throw new Error("Room facet requires the parent id.");

        const room = ioServer.createRoom(roomId, {
            env: this.env,
            sessions: this.#sessions,
            state: this.ctx as PluvRoomContext["state"],
        });

        this.#facet = new RoomFacet({
            keepAlive: (promise) => {
                this.ctx.waitUntil(promise);
            },
            room,
        });

        return this.#facet;
    }
}
