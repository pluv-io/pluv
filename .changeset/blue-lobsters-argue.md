---
"@pluv/platform-cloudflare": minor
"@pluv/io": minor
---

`@pluv/platform-cloudflare` now supports Cloudflare Worker's WebSocket Hibernation API, and usees it by default.

To switch back to not using the WebSocket Hibernation API, specify a `mode` of `attached`.

```ts
// With event-listeners directly attached to the websocket on registration (i.e. non-hibernation)
createIO({
    platform: platformCloudflare({
        mode: "attached",
    }),
});

// With event listeners unattached to the websocket during registration (i.e. hibernation)
createIO({
    platform: platformCloudflare({
        mode: "detached",
    }),
});
```
