---
"@pluv/platform-pluv": patch
---

Include built `dist/` artifacts in published npm packages via `"files": ["dist"]`. `dist` is gitignored, so without this field npm omitted the build output from 5.0.1 tarballs (packages shipped `src/` only).

This release also includes the `@pluv/platform-pluv` Workers fix: `getCrypto` uses `globalThis.crypto` only, so the ESM build no longer injects a top-level `createRequire(import.meta.url)` that crashes under workerd.
