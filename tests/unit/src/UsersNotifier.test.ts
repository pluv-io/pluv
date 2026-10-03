import { UsersNotifier } from "../../../packages/client/src/UsersNotifier";
import { describe, expect, it } from "vitest";

describe("UsersNotifier", () => {
    it("keeps a player subscription when a staff member with the same id leaves", () => {
        const notifier = new UsersNotifier();
        const player: unknown[] = [];
        const staff: unknown[] = [];

        notifier.subscribeOther("ada", (value) => {
            player.push(value);
        });
        notifier.subscribeOther(
            "ada",
            (value) => {
                staff.push(value);
            },
            { kind: "operator" },
        );

        notifier.other({ id: "ada", kind: "operator" }).next({ kind: "operator" } as never);
        notifier.other({ id: "ada", kind: "user" }).next({ kind: "user" } as never);

        expect(player).toEqual([{ kind: "user" }]);
        expect(staff).toEqual([{ kind: "operator" }]);

        notifier.delete({ id: "ada", kind: "operator" });

        expect(staff).toEqual([{ kind: "operator" }, null]);
        expect(player).toEqual([{ kind: "user" }]);

        notifier
            .other({ id: "ada", kind: "user" })
            .next({ kind: "user", presence: { cursor: 1 } } as never);

        expect(player).toEqual([{ kind: "user" }, { kind: "user", presence: { cursor: 1 } }]);
        expect(staff).toEqual([{ kind: "operator" }, null]);
    });
});
