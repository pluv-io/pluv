import { useEffect, useState } from "react";
import { runLogin } from "./runLogin";
import { Status } from "../../components/Status";
import { errorText } from "../../lib/exit";
import type { ScreenProps } from "../shared/types";
import { WhoamiScreen } from "../whoami/WhoamiScreen";

/** Open the browser and save the session. */
export const runLoginCommand = async (
    config: ScreenProps["config"],
    onOpen?: (url: string) => void,
): Promise<string> => {
    return runLogin(process.cwd(), onOpen);
};

export const LoginScreen = ({ config, done, warning }: ScreenProps) => {
    const [url, setUrl] = useState<string | null>(null);
    const [signedIn, setSignedIn] = useState(false);

    useEffect(() => {
        let stopped = false;

        void runLoginCommand(config, (opened) => {
            if (!stopped) setUrl(opened);
        }).then(
            () => {
                if (!stopped) setSignedIn(true);
            },
            (caught: unknown) => {
                if (!stopped) done(errorText(caught, "Login failed."), 1);
            },
        );

        return () => {
            stopped = true;
        };
    }, [config, done]);

    if (signedIn) return <WhoamiScreen config={config} done={done} warning={warning} />;

    return (
        <box style={{ flexDirection: "column", padding: 1 }}>
            {warning ? <text fg="#888888">{warning}</text> : null}
            <Status label="Waiting for you to finish in the browser" />
            {url ? <text fg="#888888">{`Open ${url} if the browser does not.`}</text> : null}
        </box>
    );
};
