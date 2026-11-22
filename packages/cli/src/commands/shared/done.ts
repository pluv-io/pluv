import { exit, type ExitOutput } from "../../lib/exit";
import { closeRenderer } from "../../terminal";

export type DoneResult = ExitOutput;

/** Tear down the OpenTUI screen when needed, then exit. */
export const done = (result: DoneResult): void => {
    void closeRenderer().then(() => exit(result));
};
