import { useEffect } from "react";
import { runLogout } from "./runLogout";
import { errorText } from "../../lib/exit";
import { Status } from "../../components/Status";
import type { ScreenProps } from "../shared/types";

/** Delete the saved session. */
export const runLogoutCommand = async (): Promise<string> => {
    await runLogout(process.cwd());

    return "Logged out";
};

export const LogoutScreen = ({ done, warning }: ScreenProps) => {
    useEffect(() => {
        let stopped = false;

        void runLogoutCommand().then(
            (text) => {
                if (!stopped) done(text, 0);
            },
            (caught: unknown) => {
                if (!stopped) done(errorText(caught, "Logout failed."), 1);
            },
        );

        return () => {
            stopped = true;
        };
    }, [done]);

    return (
        <box style={{ flexDirection: "column", padding: 1 }}>
            {warning ? <text fg="#888888">{warning}</text> : null}
            <Status label="Logging out" />
        </box>
    );
};
