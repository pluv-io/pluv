---
"@pluv/client": major
"@pluv/react": major
"@pluv/io": major
"@pluv/types": major
"@pluv/crdt-yjs": major
"@pluv/platform": major
---

Remove `@pluv/platform-pluv` and client event routers. Run the room with `@pluv/platform-node` or `@pluv/platform-cloudflare`. Define events on the server with `io.procedure` and `io.router`. Pass `secret` on `.config()`, and pass `authEndpoint` and `wsEndpoint` on the client.
