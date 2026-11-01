import { createFileRoute } from "@tanstack/react-router";
import { useState, useSyncExternalStore } from "react";
import { RoomPanel } from "@/components/RoomPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PluvRoomProvider } from "@/pluv";
import { isRoomName } from "@/roomName";
import { readName, writeName } from "@/session";

export const Route = createFileRoute("/")({
    component: Home,
});

function Home() {
    const [room, setRoom] = useState("sandbox");
    const storedName = useSyncExternalStore(
        () => () => {},
        readName,
        () => "Guest",
    );
    const [name, setName] = useState<string | null>(null);
    const [connected, setConnected] = useState(false);
    const displayName = name ?? storedName;
    const roomOk = isRoomName(room);
    const nameOk = displayName.trim().length > 0;

    return (
        <main className="mx-auto grid max-w-lg gap-4 p-6">
            <Card>
                <CardHeader>
                    <CardTitle>Sandbox</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3">
                    <label className="grid gap-1 text-sm">
                        Room
                        <Input
                            onChange={(event) => {
                                setRoom(event.target.value);
                            }}
                            value={room}
                        />
                    </label>
                    <label className="grid gap-1 text-sm">
                        Name
                        <Input
                            onChange={(event) => {
                                setName(event.target.value);
                            }}
                            value={displayName}
                        />
                    </label>
                    {connected ? (
                        <Button
                            onClick={() => {
                                setConnected(false);
                            }}
                            type="button"
                            variant="secondary"
                        >
                            Disconnect
                        </Button>
                    ) : (
                        <Button
                            disabled={!roomOk || !nameOk}
                            onClick={() => {
                                writeName(displayName.trim());
                                setConnected(true);
                            }}
                            type="button"
                        >
                            Connect
                        </Button>
                    )}
                    {!roomOk && (
                        <p className="text-sm text-muted-foreground">
                            Use letters, numbers, hyphens, and underscores.
                        </p>
                    )}
                </CardContent>
            </Card>
            {connected && roomOk && (
                <PluvRoomProvider initialPresence={{ count: 0 }} room={room}>
                    <RoomPanel name={displayName.trim()} />
                </PluvRoomProvider>
            )}
        </main>
    );
}
