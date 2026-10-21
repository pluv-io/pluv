import { s } from "@pluv/crdt";
import { yjs } from "@pluv/crdt-yjs";
import { manageSessions } from "@pluv/io";
import { createTreaty } from "@pluv/treaty";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createAuthorizedIO, testAuthorizeUser } from "./__utils__";

describe("IORoom treaty schema", () => {
    it("returns user, presence, and storage schemas with procedure inputs", () => {
        const presence = z.object({ selectionId: z.string().nullable() });
        const storage = yjs.schema({ messages: yjs.yArray(s.string()) });
        const treatyBuilder = createTreaty({ user: testAuthorizeUser, presence, storage });
        const select = treatyBuilder.procedure.presence
            .input(z.object({ id: z.string().nullable() }))
            .resolve(() => ({ selectionId: null }));
        const bare = treatyBuilder.procedure.presence.resolve(() => ({ selectionId: null }));
        const addMessage = treatyBuilder.procedure.storage
            .input(z.object({ text: z.string() }))
            .resolve(() => undefined);
        const treaty = treatyBuilder.router({ select, bare, addMessage });
        const io = createAuthorizedIO({ treaty });
        const sessions = manageSessions(
            io.server({ getInitialStorage: () => null }).createRoom("treaty-schema"),
        );
        const schema = sessions.getTreatySchema();
        const again = sessions.getTreatySchema();

        (schema.user as { type?: string }).type = "changed";

        expect(again.user).toMatchObject({ type: "object" });
        expect(schema.user).toMatchObject({ type: "changed" });
        expect(schema.presence?.schema).toMatchObject({ type: "object" });
        expect(schema.presence?.procedures.select.input).toMatchObject({ type: "object" });
        expect(schema.presence?.procedures.bare.input).toBeNull();
        expect(schema.storage?.schema).toMatchObject({ kind: "y.doc" });
        expect(schema.storage?.procedures.addMessage.input).toMatchObject({ type: "object" });
    });

    it("returns null domains when the treaty has only a user", () => {
        const io = createAuthorizedIO();
        const sessions = manageSessions(io.server().createRoom("treaty-user-only"));

        expect(sessions.getTreatySchema().presence).toBeNull();
        expect(sessions.getTreatySchema().storage).toBeNull();
        expect(sessions.getTreatySchema().user).toMatchObject({ type: "object" });
    });

    it("fails the whole document when a procedure input cannot emit JSON Schema", () => {
        const treatyBuilder = createTreaty({
            user: testAuthorizeUser,
            presence: z.object({ selectionId: z.string().nullable() }),
        });
        const bad = treatyBuilder.procedure.presence
            .input({
                "~standard": {
                    version: 1,
                    vendor: "test",
                    validate: (value: unknown) => ({ value }),
                },
            } as never)
            .resolve(() => ({ selectionId: null }));
        const io = createAuthorizedIO({ treaty: treatyBuilder.router({ bad }) });
        const sessions = manageSessions(io.server().createRoom("treaty-bad-input"));

        expect(() => sessions.getTreatySchema()).toThrow(/Standard JSON Schema/);
    });

    it("throws when storage cannot serialize its schema", () => {
        const storage = yjs.schema({ messages: yjs.yArray(s.string()) });
        storage.toJSON = undefined as never;
        const treaty = createTreaty({ user: testAuthorizeUser, storage });
        const io = createAuthorizedIO({ treaty });
        const sessions = manageSessions(
            io.server({ getInitialStorage: () => null }).createRoom("treaty-storage-schema"),
        );

        expect(() => sessions.getTreatySchema()).toThrow("Treaty has no storage schema");
    });
});
