#!/usr/bin/env node
import { createRequire } from "node:module";
import Pastel from "pastel";

const require = createRequire(import.meta.url);
const pkg = require("../package.json") as {
    name: string;
    version: string;
    description: string;
};

const app = new Pastel({
    description: pkg.description,
    importMeta: import.meta,
    name: pkg.name,
    version: pkg.version,
});

await app.run();
