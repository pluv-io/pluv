import { useEffect, useState } from "react";
import { runLogin } from "./runLogin";
import { palette } from "../../log/palette";
import { Status } from "../../components/Status";
import type { LogEvent, LogListener } from "../../log/event";
import { done } from "../shared/done";
import type { ScreenProps } from "../shared/types";
import { WhoamiScreen } from "../whoami/WhoamiScreen";

/** Open the browser and save the session. */
export const runLoginCommand = async (
    config: ScreenProps["config"],
    onEvent?: LogListener,
): Promise<string> => {
    return runLogin(process.cwd(), (url) => {
        onEvent?.({ type: "output", text: `Open ${url} if the browser does not.\n` });
    });
};

export const LoginScreen = ({ config, warning }: ScreenProps) => {
    const [events, setEvents] = useState<LogEvent[]>([]);
    const [signedIn, setSignedIn] = useState(false);

    useEffect(() => {
        let stopped = false;

        void runLoginCommand(config, (event) => {
            if (!stopped) setEvents((current) => [...current, event]);
        }).then(
            () => {
                if (!stopped) setSignedIn(true);
            },
            (caught: unknown) => {
                if (!stopped) done({ code: 1, stderr: caught instanceof Error ? caught.message : "Login failed." });
            },
        );

        return () => {
            stopped = true;
        };
    }, [config]);

    if (signedIn) return <WhoamiScreen config={config} warning={warning} />;

    return (
        <box style={{ flexDirection: "column", padding: 1 }}>
            {warning ? <text fg={palette.muted}>{warning}</text> : null}
            <Status label="Waiting for you to finish in the browser" />
            {events.map((event, index) =>
                event.type === "output" ? (
                    <text key={index} fg={palette.muted}>
                        {event.text.trimEnd()}
                    </text>
                ) : null,
            )}
        </box>
    );
};
