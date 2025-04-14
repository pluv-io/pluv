---
"@pluv/client": patch
---

Add the ability to configure the reconnect timeout (in milliseconds) for a `PluvRoom`, and lowered the default reconnect timeout from 30s to 5s. Values will be automatically clamped to between 1s and 60s.

```ts
// Both of these are valid
const room = client.createRoom("my-room", {
    // Set timeout to a fixed 10s
    reconnectTimeoutMs: 10_000,
});

const room = client.createRoom("my-room", {
    /**
     * `attempts` is the count of failed reconnect attempts, starting from 0 on the first attempt.
     * The returned value will be how long until the next attempt.
     */
    reconnectTimeoutMs: ({ attempts }) => {
        return 10_000 + (1_000 * Math.pow(2, attempts));
    },
});
```
