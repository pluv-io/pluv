import { afterEach, describe, expect, it } from "vitest";
import { schema, yText } from "../schema";

const docs: { destroy(): void }[] = [];

const create = () => {
    const doc = schema({ content: yText() }).getInitialized();

    docs.push(doc);

    return doc;
};

const required = (update: string | null): string => {
    if (!update) throw new Error("Expected an update");

    return update;
};

afterEach(() => {
    docs.splice(0).forEach((doc) => doc.destroy());
});

describe("yjs storage sync", () => {
    it("returns null from captureUpdate when the function changes nothing", () => {
        expect(create().captureUpdate(() => undefined)).toBeNull();
    });

    it("returns only the changes made inside captureUpdate", () => {
        const source = create();

        source.get("content").insert(0, "hello");

        const base = source.getEncodedState();
        const extra = required(source.captureUpdate(() => source.get("content").insert(5, "!")));

        expect(extra).not.toBe(source.getEncodedState());

        const behind = create().applyEncodedState({ update: base });

        behind.applyEncodedState({ update: extra });

        expect(behind.toJson()).toEqual({ content: "hello!" });
        expect(behind.hasPending()).toBe(false);
    });

    it("fills another copy from its state vector", () => {
        const source = create();

        source.get("content").insert(0, "server");

        const base = source.getEncodedState();
        const behind = create().applyEncodedState({ update: base });

        source.get("content").insert(6, " live");

        const diff = source.encodeDiff(behind.getStateVector());
        const synced = create()
            .applyEncodedState({ update: base })
            .applyEncodedState({ update: diff });

        expect(diff).not.toBe(source.getEncodedState());
        expect(synced.toJson()).toEqual({ content: "server live" });
        expect(synced.hasPending()).toBe(false);
    });

    it("returns every change when the state vector is empty", () => {
        const source = create();

        source.get("content").insert(0, "server live");

        const synced = create().applyEncodedState({ update: source.encodeDiff("") });

        expect(synced.toJson()).toEqual({ content: "server live" });
    });

    it("adds nothing when the state vector is already current", () => {
        const source = create();

        source.get("content").insert(0, "server");

        const copy = create().applyEncodedState({ update: source.getEncodedState() });

        copy.applyEncodedState({ update: source.encodeDiff(source.getStateVector()) });

        expect(copy.toJson()).toEqual({ content: "server" });
        expect(copy.hasPending()).toBe(false);
    });

    it("waits when a change arrives before the earlier change it needs", () => {
        const source = create();

        source.get("content").insert(0, "hello");

        const earlier = source.getEncodedState();
        const later = required(
            source.captureUpdate(() => source.get("content").insert(5, " world")),
        );
        const behind = create();

        behind.applyEncodedState({ update: later });

        expect(behind.hasPending()).toBe(true);

        behind.applyEncodedState({ update: earlier });

        expect(behind.hasPending()).toBe(false);
        expect(behind.toJson()).toEqual({ content: "hello world" });
    });

    it("reports an applied update with the origin it was given", () => {
        const source = create();

        source.get("content").insert(0, "hello");

        const target = create();
        const prior = target.getEncodedState();
        const seen: { origin: string | null; update: string }[] = [];

        target.subscribe((event) => {
            seen.push({ origin: event.origin ?? null, update: event.update });
        });
        target.applyEncodedState({ origin: "$storageUpdated", update: source.getEncodedState() });

        expect(seen.map((event) => event.origin)).toEqual(["$storageUpdated"]);
        expect(target.toJson()).toEqual({ content: "hello" });
        expect(target.hasPending()).toBe(false);

        const replay = create()
            .applyEncodedState({ update: prior })
            .applyEncodedState({ update: seen[0]?.update });

        expect(replay.toJson()).toEqual({ content: "hello" });
    });
});
