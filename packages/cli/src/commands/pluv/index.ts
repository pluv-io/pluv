import { Command } from "effect/cli";
import { build } from "../build";
import { deploy } from "../deploy";
import { dev } from "../dev";
import { login } from "../login";
import { logout } from "../logout";
import { whoami } from "../whoami";

/** The `pluv` command tree. `effect/cli` parses arguments and prints help from this. */
export const pluv = Command.make("pluv").pipe(
    Command.withDescription("CLI for pluv.io"),
    Command.withSubcommands([login, logout, whoami, build, dev, deploy]),
);
