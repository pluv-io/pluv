---
"@pluv/io": minor
---

Updated createIO config option `initialStorage` to be renamed to `getInitialStorage` and updated the params to use an object that includes platform parameters.

Previously:
```ts
createIO({
    initialStorage(room: string): Promise<string> => {
        // ...
    },
});
```

Now:
```ts
createIO({
    platform: platformCloudflare<Env>(),
    getInitialStorage({
        // If you're using Cloudflare, this is the Cloudflare env parameter
        env,
        // The name of the room
        room,
    }): Promise<string> => {
        // ...
    },
});
```


