import { createRequire } from "node:module";
import { NodeRuntime, NodeServices } from "@effect/platform-node";
import { Effect } from "effect";
import { CliConfig, Command, GlobalFlag } from "effect/cli";
import { pluv } from "./commands";

const require = createRequire(import.meta.url);
const pkg = require("../package.json") as { version: string };

NodeRuntime.runMain(
    pluv.pipe(
        Command.run({ version: pkg.version }),
        Effect.provide(CliConfig.layer({ builtIns: [GlobalFlag.Help, GlobalFlag.Version] })),
        Effect.provide(NodeServices.layer),
    ),
    { disableErrorReporting: true },
);
