---
"pluv": minor
---

`pluv build` typechecks the TypeScript server entry before bundling. Install `typescript` in the project. The entry must be a `.ts`, `.tsx`, `.mts`, or `.cts` module, and the project needs a `tsconfig.json`.

Skip the check with `pluv build --no-typecheck` or `typescript.ignoreBuildErrors` in `pluv.config`. JavaScript files can still be imported from the entry. A JavaScript path used as the entry is rejected.

Hosted servers that only use `@pluv/platform` do not need `@cloudflare/workers-types` for this check. Add those types when the entry names Worker APIs. `pluv dev` does not typecheck.
