#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const [major = 0, minor = 0] = process.versions.node.split(".").map(Number);

if (major < 26 || (major === 26 && minor < 4)) {
    process.stderr.write(
        `pluv requires Node.js 26.4 or later. This process is ${process.version}.\n`,
    );
    process.exit(1);
}

// OpenTUI loads its native renderer through Node's FFI. Restart once with the flag.
if (!process.execArgv.includes("--experimental-ffi")) {
    const args = ["--experimental-ffi", "--disable-warning=ExperimentalWarning"];

    for (const flag of process.execArgv) {
        if (!args.includes(flag)) args.push(flag);
    }

    args.push(...process.argv.slice(1));

    const child = spawnSync(process.execPath, args, { stdio: "inherit" });

    process.exit(child.status ?? 1);
}

// OpenTUI prints process warnings itself. Node still emits the FFI warning when
// that warning is disabled, and the line is left on the main screen.
const emitWarning = process.emitWarning.bind(process);

process.emitWarning = ((
    warning: string | Error,
    type?: unknown,
    code?: unknown,
    ctor?: unknown,
) => {
    const text = typeof warning === "string" ? warning : warning.message;

    if (type === "ExperimentalWarning" || text.startsWith("FFI is an experimental feature")) {
        return;
    }

    emitWarning(warning, type as never, code as never, ctor as never);
}) as typeof process.emitWarning;

await import("./program.js");
