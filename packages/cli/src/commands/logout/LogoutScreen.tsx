import { useEffect } from "react";
import { runLogout } from "./runLogout";
import { palette } from "../../log/palette";
import { Status } from "../../components/Status";
import { done } from "../shared/done";
import type { ScreenProps } from "../shared/types";

/** Delete the saved session. */
export const runLogoutCommand = async (): Promise<string> => {
    await runLogout(process.cwd());

    return "Logged out";
};

export const LogoutScreen = ({ warning }: ScreenProps) => {
    useEffect(() => {
        let stopped = false;

        void runLogoutCommand().then(
            (text) => {
                if (!stopped) done({ code: 0, stderr: text });
            },
            (caught: unknown) => {
                if (!stopped)
                    done({
                        code: 1,
                        stderr: caught instanceof Error ? caught.message : "Logout failed.",
                    });
            },
        );

        return () => {
            stopped = true;
        };
    }, []);

    return (
        <box style={{ flexDirection: "column", padding: 1 }}>
            {warning ? <text fg={palette.muted}>{warning}</text> : null}
            <Status label="Logging out" />
        </box>
    );
};
