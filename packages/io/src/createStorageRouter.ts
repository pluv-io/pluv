import type { BaseClientEventRecord } from "@pluv/types";
import type { IODefs, SetKey } from "./IODefs";
import { PluvProcedure } from "./PluvProcedure";
import type { PluvRouter } from "./PluvRouter";
import type { CreateBaseRouterParams } from "./createBaseRouter";
import type { StorageEventContext } from "./types";
import { createInternalPluvRouter, oneLine } from "./utils";

const baseProcedureFactory =
    <T extends IODefs>() =>
    <TEvent extends keyof BaseClientEventRecord>() => {
        return new PluvProcedure<T, BaseClientEventRecord[TEvent], {}>();
    };

type BaseRouter<T extends IODefs> = PluvRouter<SetKey<T, "events", {}>>;

const asStorage = <T extends IODefs>(event: object): StorageEventContext<T> => {
    return event as StorageEventContext<T>;
};

/** Storage `$` events. These run beside the doc. */
export const createStorageRouter = <T extends IODefs = IODefs>(
    params: CreateBaseRouterParams<T>,
): BaseRouter<T> => {
    const { limits } = params;
    const logDebug = params.logDebug ?? (() => undefined);
    const baseProcedure = baseProcedureFactory<T>();

    return createInternalPluvRouter({
        $syncStorage: baseProcedure<"$syncStorage">().self((data, { doc }) => {
            const update = data.stateVector
                ? doc.encodeDiff(data.stateVector)
                : doc.getEncodedState();

            return { $storageDiff: { update } };
        }),
        $updateStorage: baseProcedure<"$updateStorage">().broadcast((data, raw) => {
            const { doc } = asStorage<T>(raw);
            const origin = data.origin;
            const update = data.update ?? null;

            if (origin === "$initialized") return {};
            if (!update) return {};

            const before = doc.getStateVector();
            const wasPending = doc.hasPending();

            doc.applyEncodedState({ update });

            const integrated = doc.getStateVector() !== before;

            // These bytes did not enter the document. Ask the sender for the missing
            // history. A resync reply that still does not integrate stops here.
            if (!integrated && (doc.hasPending() || !doc.canDetectPending())) {
                logDebug("Storage update did not integrate");

                if (data.resync) return {};

                return { $storageResync: { stateVector: doc.getStateVector() } };
            }

            const state = integrated ? doc.encodeDiff(before) : update;
            const encodedState = doc.getEncodedState();
            const storageSize = new TextEncoder().encode(encodedState).length;

            if (!!limits.storageMaxSize && storageSize > limits.storageMaxSize) {
                throw new Error(oneLine`
                        Large Storage. Storage must be at most
                        ${limits.storageMaxSize.toLocaleString()} bytes.
                        Current size: ${storageSize.toLocaleString()} bytes
                    `);
            }

            if (doc.hasPending() && !wasPending) {
                return {
                    $storageUpdated: { state },
                    $storageResync: { stateVector: doc.getStateVector() },
                };
            }

            return { $storageUpdated: { state } };
        }),
    });
};
