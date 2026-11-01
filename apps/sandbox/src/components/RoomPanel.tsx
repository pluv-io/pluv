import { Suspense, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useMyPresence, useOthers, usePresence, useStorage, useStorageField } from "@/pluv";

const PresenceCard = ({ name }: { name: string }) => {
    const [myPresence] = useMyPresence();
    const others = useOthers();
    const presence = usePresence();

    return (
        <Card>
            <CardHeader>
                <CardTitle>Presence</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
                <div className="flex items-center gap-2">
                    <Badge>{name}</Badge>
                    <span className="text-sm text-muted-foreground">
                        count {myPresence?.count ?? 0}
                    </span>
                </div>
                <Button
                    onClick={() => {
                        void presence.increment({});
                    }}
                    type="button"
                >
                    Increment
                </Button>
                <div className="flex flex-wrap gap-2">
                    {others.map((other) => (
                        <Badge key={other.data.id} variant="secondary">
                            {other.data.name} {other.presence.count}
                        </Badge>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

const StorageCard = ({ name }: { name: string }) => {
    const [draft, setDraft] = useState("");
    const [messages] = useStorageField("messages");
    const storage = useStorage();

    return (
        <Card>
            <CardHeader>
                <CardTitle>Storage</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
                <form
                    className="flex gap-2"
                    onSubmit={(event) => {
                        event.preventDefault();
                        const message = draft.trim();

                        if (!message) return;

                        storage.addMessage({ message, name });
                        setDraft("");
                    }}
                >
                    <Input
                        onChange={(event) => {
                            setDraft(event.target.value);
                        }}
                        placeholder="Message"
                        value={draft}
                    />
                    <Button type="submit">Add</Button>
                </form>
                <ul className="grid gap-2 text-sm">
                    {messages.map((item, index) => (
                        <li key={`${item.name ?? "user"}-${index}`}>
                            <span className="text-muted-foreground">{item.name ?? "Someone"}:</span>{" "}
                            {item.message}
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
};

export const RoomPanel = ({ name }: { name: string }) => {
    return (
        <div className="grid gap-4">
            <PresenceCard name={name} />
            <Suspense fallback={<p className="text-sm text-muted-foreground">Loading storage…</p>}>
                <StorageCard name={name} />
            </Suspense>
        </div>
    );
};
