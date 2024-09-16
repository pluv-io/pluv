import type { FC } from "react";
import { useState } from "react";
import { event, useBroadcast, useConnection } from "../../../pluv-io/yjs/node";

export type BroadcastRoomProps = Record<string, never>;

export const BroadcastRoom: FC<BroadcastRoomProps> = () => {
    const [doubledValue, setDoubledValue] = useState<number>(0);
    const [subtractedValue, setSubtractedValue] = useState<number>(0);
    const broadcast = useBroadcast();

    const connectionId = useConnection((connection) => connection.id);

    event.doubledNumber.useEvent(({ data }) => {
        setDoubledValue(data.value);
    });

    event.subtractedNumber.useEvent(({ data }) => {
        setSubtractedValue(data.value);
    });

    return (
        <div id="broadcast-room">
            <div>Broadcast Room</div>
            <br />
            {!!connectionId && <div id="connection-id">{connectionId}</div>}
            <br />
            <button
                id="button-subtract-from-7"
                onClick={() => {
                    broadcast.subtract5({ value: 7 });
                }}
                type="button"
            >
                Subtract from 7
            </button>
            <button
                id="button-subtract-from-11"
                onClick={() => {
                    broadcast.subtract5({ value: 11 });
                }}
                type="button"
            >
                Subtract from 11
            </button>
            <button
                id="button-subtract-from-17"
                onClick={() => {
                    broadcast.subtract5({ value: 17 });
                }}
                type="button"
            >
                Subtract from 17
            </button>
            <button
                id="button-double-7"
                onClick={() => {
                    broadcast.doubleNumber({ value: 7 });
                }}
                type="button"
            >
                Double from 7
            </button>
            <br />
            <div id="doubled-value">{doubledValue}</div>
            <div id="subtracted-value">{subtractedValue}</div>
        </div>
    );
};
