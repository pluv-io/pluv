import { readdirSync } from "fs";
import path from "path";
import { z } from "zod";
import { require } from "../require.js";
import { ZodPluvConfig } from "../schemas/index.js";

export type PluvConfig = z.input<typeof ZodPluvConfig>;
export type ParsedPluvConfig = z.output<typeof ZodPluvConfig>;

export const getConfig = (): ParsedPluvConfig => {
    const filenames = readdirSync(process.cwd());

    const configName = ["pluv.config.js", "pluv.config.json"].find(
        (validName) => filenames.some((filename) => filename === validName),
    );

    const config: PluvConfig = configName
        ? require(path.resolve(process.cwd(), `./${configName}`))
        : {};
    const parsed = ZodPluvConfig.parse(config);

    const input =
        parsed.input ??
        ["pluv.ts", "pluv.mjs", "pluv.js"].find((validName) =>
            filenames.some((filename) => filename === validName),
        );

    return { ...parsed, input };
};
