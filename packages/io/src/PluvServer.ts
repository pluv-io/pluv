import type { AbstractCrdtDocFactory } from "@pluv/crdt";
import { noop } from "@pluv/crdt";
import type {
    BaseIOAuthorize,
    IOAuthorize,
    IORouterLike,
    InferIOAuthorize,
    InferIOAuthorizeUser,
    JsonObject,
} from "@pluv/types";
import colors from "kleur";
import type { AbstractPlatform, InferPlatformRoomContextType } from "./AbstractPlatform";
import { IORoom } from "./IORoom";
import type { PluvRouterEventConfig } from "./PluvRouter";
import { PluvRouter } from "./PluvRouter";
import type { JWTEncodeParams } from "./authorize";
import { authorize } from "./authorize";
import type { IORoomListenerEvent, PluvIOListeners } from "./types";
import { __PLUV_VERSION } from "./version";

export type InferIORoom<TServer extends PluvServer<any, any, any, any>> =
    TServer extends PluvServer<infer IPlatform, infer IAuthorize, infer IContext, infer IEvents>
        ? IORoom<IPlatform, IAuthorize, IContext, IEvents>
        : never;

export type PluvServerConfig<
    TPlatform extends AbstractPlatform<any> = AbstractPlatform<any>,
    TAuthorize extends IOAuthorize<any, any, InferPlatformRoomContextType<TPlatform>> = BaseIOAuthorize,
    TContext extends JsonObject = {},
    TEvents extends PluvRouterEventConfig<TPlatform, TAuthorize, TContext> = {},
> = Partial<PluvIOListeners<TPlatform>> & {
    authorize?: TAuthorize;
    context?: TContext;
    crdt?: { doc: (value: any) => AbstractCrdtDocFactory<any> };
    debug?: boolean;
    platform: TPlatform;
    router?: PluvRouter<TPlatform, TAuthorize, TContext, TEvents>;
};

export type GetRoomOptions<TPlatform extends AbstractPlatform> = {
    debug?: boolean;
} & InferPlatformRoomContextType<TPlatform>;

export class PluvServer<
    TPlatform extends AbstractPlatform<any> = AbstractPlatform<any>,
    TAuthorize extends IOAuthorize<any, any, InferPlatformRoomContextType<TPlatform>> = BaseIOAuthorize,
    TContext extends JsonObject = {},
    TEvents extends PluvRouterEventConfig<TPlatform, TAuthorize, TContext> = {},
> implements IORouterLike<TEvents>
{
    private _rooms = new Map<string, IORoom<TPlatform, TAuthorize, TContext, TEvents>>();

    readonly _authorize: TAuthorize | null = null;
    readonly _context: TContext = {} as TContext;
    readonly _crdt: { doc: (value: any) => AbstractCrdtDocFactory<any> };
    readonly _debug: boolean;
    readonly _listeners: PluvIOListeners<TPlatform>;
    readonly _platform: TPlatform;
    readonly _router: PluvRouter<TPlatform, TAuthorize, TContext, TEvents>;
    readonly _version: string = __PLUV_VERSION as any;

    public get _events() {
        return this._router._events;
    }

    constructor(options: PluvServerConfig<TPlatform, TAuthorize, TContext, TEvents>) {
        const {
            authorize,
            context,
            crdt = noop,
            debug = false,
            onRoomDeleted,
            onStorageUpdated,
            platform,
            router = new PluvRouter<TPlatform, TAuthorize, TContext, TEvents>({} as TEvents),
        } = options;

        this._crdt = crdt;
        this._debug = debug;
        this._platform = platform;
        this._router = router ?? null;

        if (authorize) this._authorize = authorize;
        if (context) this._context = context;

        this._listeners = {
            onRoomDeleted: (event) => onRoomDeleted?.(event),
            onStorageUpdated: (event) => onStorageUpdated?.(event),
        };
    }

    public async createToken(
        params: JWTEncodeParams<InferIOAuthorizeUser<InferIOAuthorize<this>>, TPlatform>,
    ): Promise<string> {
        if (!this._authorize) {
            throw new Error("IO does not specify authorize during initialization.");
        }

        const ioAuthorize =
            typeof this._authorize === "function" ? this._authorize(params) : (this._authorize as { secret: string });

        const secret = ioAuthorize.secret;

        return await authorize({
            platform: this._platform,
            secret,
        }).encode(params);
    }

    public getRoom(room: string, options: GetRoomOptions<TPlatform>): IORoom<TPlatform, TAuthorize, TContext, TEvents> {
        const { debug, ...platformRoomContext } = options;

        this._purgeEmptyRooms();

        if (!/^[a-z0-9]+[a-z0-9\-_]+[a-z0-9]+$/i.test(room)) {
            throw new Error("Unsupported room name");
        }

        const platform = this._platform;
        const oldRoom = this._rooms.get(room);

        if (oldRoom) return oldRoom;

        const roomContext = {
            ...this._context,
            ...platformRoomContext,
        } as TContext & InferPlatformRoomContextType<TPlatform>;

        const newRoom = new IORoom<TPlatform, TAuthorize, TContext, TEvents>(room, {
            authorize: this._authorize ?? undefined,
            context: roomContext,
            crdt: this._crdt,
            debug: debug ?? this._debug,
            onDestroy: ({ encodedState, room }) => {
                this._logDebug(`${colors.blue("Deleting empty room:")} ${room}`);

                const roomContext = {
                    room,
                    encodedState,
                    ...platformRoomContext,
                } as IORoomListenerEvent<TPlatform> & InferPlatformRoomContextType<TPlatform>;

                this._rooms.delete(room);
                this._listeners.onRoomDeleted(roomContext);

                if (this._debug) {
                    const rooms = Array.from(this._rooms.keys());

                    this._logDebug(`${colors.blue("Deleted room:")} ${room}`);
                    this._logDebug(`${colors.blue("Rooms available:")} ${rooms.join(", ")}`);
                }
            },
            platform,
            router: this._router,
        });

        this._rooms.set(room, newRoom);

        if (this._debug) {
            const rooms = Array.from(this._rooms.keys());

            this._logDebug(`${colors.blue("Created room:")} ${room}`);
            this._logDebug(`${colors.blue("Rooms available:")} ${rooms.join(", ")}`);
        }

        return newRoom;
    }

    private _logDebug(...data: any[]): void {
        this._debug && console.log(...data);
    }

    private _purgeEmptyRooms(): void {
        const rooms = Array.from(this._rooms.entries());

        rooms.forEach(([id, room]) => {
            if (room.getSize()) return;

            this._rooms.delete(id);
        });
    }
}
