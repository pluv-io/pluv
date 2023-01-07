# PubSub and Persistance

> **Note**
> PubSubs and Persistance is currently only supported with @pluv/platform-node

You may want to run a single room across multiple servers, in which case the events will need to be
communicated between the servers within the same room. For that a PubSubs will be necessary to share the events, and Persistance will be necessary for syncing storage state across servers.

## How to setup a PubSub and Persistance

Install your PubSub and Persistance of your choosing

```bash
$ npm install @pluv/pubsub-redis @pluv/persistance-redis
```

Create PluvIO with your selected PubSub and Persistance

```ts
// ./io.ts

import { createIO } from "@pluv/io";
import { platformNode } from "@pluv/platform-node";
import { PubSubRedis } from "@pluv/pubsub-redis";
import { PersistanceRedis } from "@pluv/persistance-redis";
import { Redis } from "ioredis";

const redis = new Redis({
    /* redis config here */
})

export const io = createIO({
    platform: platformNode({
        persistance: new PersistanceRedis({ client: redis }),
        pubSub: new PubSubRedis({
            publisher: redis,
            subscriber: redis,
        }),
    })
});
```

And that's it. Your PluvIO should be configured to work between servers.
