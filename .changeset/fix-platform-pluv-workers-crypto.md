---
"@pluv/platform-pluv": patch
---

Fix Cloudflare Workers / workerd startup crash caused by a top-level `createRequire(import.meta.url)` injected when bundling a Node `require("node:crypto")` fallback.

`getCrypto` now uses `globalThis.crypto` only (available on modern Node, browsers, and Workers). This removes the Node `require` path so the published ESM build no longer initializes `createRequire` on import.
