---
"@pluv/crdt-loro": minor
---

Add runtime-specific conditional exports for browser, workerd, bun, node, and deno. Cloudflare Workers and Bun resolve to `loro-crdt/bundler`; Node and Deno resolve to `loro-crdt/nodejs`; browsers resolve to bare `loro-crdt`.
