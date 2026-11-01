---
"pluv": minor
---

Run a local room server with `pluv dev`.

Point the client `wsEndpoint` at `ws://localhost:8787/api/pluv/room/${room}`. Set the server module in `pluv.config.ts` with `defineConfig` from `pluv`. Without that file, `pluv dev` uses `./pluv.ts` on port 8787 and warns. Map `process.env` onto `env` in that config to copy selected variables onto the room. Saving the server module reloads the room. Storage is kept, and connected clients reconnect.
