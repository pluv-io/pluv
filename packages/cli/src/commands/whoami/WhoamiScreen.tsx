import { useEffect, useState } from "react";
import { useKeyboard } from "@opentui/react";
import { runWhoami, type WhoamiAccount } from "./runWhoami";
import { errorText } from "../../lib/exit";
import { AccountTable } from "../../components/AccountTable";
import { Status } from "../../components/Status";
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

export const WhoamiScreen = ({ done, warning }: ScreenProps) => {
    const [account, setAccount] = useState<WhoamiAccount | null>(null);

    useEffect(() => {
        let stopped = false;

        void runWhoami().then(
            (next) => {
                if (!stopped) setAccount(next);
            },
            (caught: unknown) => {
                if (!stopped) done(errorText(caught, "Could not read the account."), 1);
            },
        );

        return () => {
            stopped = true;
        };
    }, [done]);

    useKeyboard((key) => {
        if (!account) return;
        if (key.name !== "return" && key.name !== "escape" && key.name !== "q") return;

        done(whoamiText(account), 0);
    });

    if (!account) {
        return (
            <box style={{ padding: 1 }}>
                {warning ? <text fg="#888888">{warning}</text> : null}
                <Status label="Retrieving user details" />
            </box>
        );
    }

    return (
        <box style={{ flexDirection: "column", padding: 1 }}>
            {warning ? <text fg="#888888">{warning}</text> : null}
            <text>
                {"You are logged in with an OAuth Token, associated with "}
                <span fg="#6366f1">{account.email}</span>
                {"."}
            </text>
            <AccountTable id={account.id} name={account.name} />
            <text fg="#888888">enter to close</text>
        </box>
    );
};
