import { useEffect, useState } from "react";
import { useKeyboard } from "@opentui/react";
import { runWhoami, type WhoamiAccount } from "./runWhoami";
import { AccountTable } from "../../components/AccountTable";
import { palette } from "../../log/palette";
import { Status } from "../../components/Status";
import { done } from "../shared/done";
import type { ScreenProps } from "../shared/types";

/** Lines left on the terminal after the table closes. */
export const whoamiText = (account: WhoamiAccount): string => {
    return [
        `You are logged in with an OAuth Token, associated with ${account.email}.`,
        `Account Name  ${account.name}`,
        `Account ID    ${account.id}`,
    ].join("\n");
};

export const runWhoamiCommand = async (): Promise<string> => {
    return whoamiText(await runWhoami());
};

export const WhoamiScreen = ({ warning }: ScreenProps) => {
    const [account, setAccount] = useState<WhoamiAccount | null>(null);

    useEffect(() => {
        let stopped = false;

        void runWhoami().then(
            (next) => {
                if (!stopped) setAccount(next);
            },
            (caught: unknown) => {
                if (!stopped)
                    done({
                        code: 1,
                        stderr:
                            caught instanceof Error
                                ? caught.message
                                : "Could not read the account.",
                    });
            },
        );

        return () => {
            stopped = true;
        };
    }, []);

    useKeyboard((key) => {
        if (!account) return;
        if (key.name !== "return" && key.name !== "escape" && key.name !== "q") return;

        done({ code: 0, stderr: whoamiText(account) });
    });

    if (!account) {
        return (
            <box style={{ padding: 1 }}>
                {warning ? <text fg={palette.muted}>{warning}</text> : null}
                <Status label="Retrieving user details" />
            </box>
        );
    }

    return (
        <box style={{ flexDirection: "column", padding: 1 }}>
            {warning ? <text fg={palette.muted}>{warning}</text> : null}
            <text>
                {"You are logged in with an OAuth Token, associated with "}
                <span fg={palette.accent}>{account.email}</span>
                {"."}
            </text>
            <AccountTable id={account.id} name={account.name} />
            <text fg={palette.muted}>enter to close</text>
        </box>
    );
};
