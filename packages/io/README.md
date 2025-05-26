<div align="center">
  <a href="https://pluv.io/docs/introduction">
    <img src="https://github.com/pluv-io/pluv/blob/master/assets/pluv-icon-192x192.png?raw=true" alt="Pluv.IO" width="156" style="border-radius:16px" />
  </a>
</div>

<h1 align="center">pluv.io</h1>
<h3 align="center">TypeSafe Primitives for a Realtime Web</h3>

<p align="center">
  <a href="https://www.npmjs.com/package/@pluv/io">
    <img src="https://img.shields.io/npm/v/@pluv/io" alt="npm @pluv/io" />
  </a>
  <a href="https://github.com/pluv-io/pluv/blob/master/LICENSE">
    <img alt="GitHub" src="https://img.shields.io/github/license/pluv-io/pluv" alt="License MIT" />
  </a>
  <a href="https://commitizen.github.io/cz-cli/">
    <img src="https://img.shields.io/badge/commitizen-friendly-brightgreen.svg" alt="Commitizen friendly" />
  </a>
  <img src="https://badgen.net/badge/-/TypeScript?icon=typescript&label&labelColor=blue&color=555555" alt="TypeScript" />
</p>

<div align="center">
<a href="https://www.producthunt.com/posts/pluv-io?embed=true&utm_source=badge-featured&utm_medium=badge&utm_souce=badge-pluv&#0045;io" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=961147&theme=light&t=1746462368894" alt="pluv&#0046;io - Open&#0032;source&#0032;multiplayer&#0032;APIs&#0044;&#0032;powered&#0032;by&#0032;TypeScript | Product Hunt" style="width: 250px; height: 54px;" width="250" height="54" /></a>
</div>

<h4 align="center">💕 Inspired by <a href="https://trpc.io">trpc</a> 💕 <a href="https://docs.yjs.dev/">yjs</a> 💕 <br />and <a href="https://workers.cloudflare.com/">Cloudflare Workers</a> 💕</h4>

## Intro

**[pluv.io](https://pluv.io) allows you to more easily build realtime multiplayer experiences with a fully typesafe API and powerful abstractions as primitives, so that you can focus on building for your end users.**

Self-host on [Cloudflare Workers](https://pluv.io/docs/quickstart/cloudflare-workers) or [Node.js](https://pluv.io/docs/quickstart/nodejs); or [get started on the pluv.io network](https://pluv.io/signup).

## Preview

Create your pluv.io backend

```ts
// backend
const io = createIO(platformNode({ crdt: yjs }));

export const ioServer = io.server({
  router: io.router({
    sendGreeting: io.procedure
      .input(z.object({ message: z.string() }))
      .broadcast(({ message }) => ({
        receiveGreeting: { message }
      }))
  })
});
```

Create your frontend client with your backend types

```ts
// frontend
const types = infer((i) => ({ io: i<typeof ioServer> }));
const io = createClient({
  types,
  initialStorage: yjs.doc((t) => ({
    messages: t.array<string>("messages"),
  })),
  presence: z.object({
    selectionId: z.string().nullable()
  })
});

const {
  event,
  useBroadcast,
  useMyPresence,
  useOthers,
  useStorage
} = createBundle(io);
```

Use powerful primitives to build realtime features

```tsx
// react
event.receiveGreeting.useEvent(({ data }) => { /* ... */});
//                                ^? const data: { message: string }

const broadcast = useBroadcast();

broadcast.sendGreeting({ message: "hello world" });
//        ^? const sendGreeting: (data: { message: string }) => void

const [mySelection, update] = useMyPresence((presence) => {
//     ^? const mySelection: string | null
  return presence.selectionId;
});

const others = useOthers((others) => {
//    ^? const others = string[]
  return others.map((other) => other.presence.selectionId);
});

const [
  messages,
// ^? const messages: string[] | null
  sharedType
// ^? YArray<string> | null
] = useStorage("messages");
```

## Documentation

The full documentation is available at [pluv.io](https://pluv.io/docs/introduction).

## Features

- ✅ Automatic type-safety
- ✅ Basic events
- ✅ Rooms
- ✅ Authentication
- ✅ Awareness + Presence
- ✅ [CRDTs](https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type)
    - ✅ [Yjs](https://docs.yjs.dev/)
        - ✅ [Provider](https://github.com/yjs/yjs?tab=readme-ov-file#providers)
        - ✅ **Shared Types**
            - ✅ [Map](https://docs.yjs.dev/api/shared-types/y.map)
            - ✅ [Array](https://docs.yjs.dev/api/shared-types/y.array)
            - ✅ [Text](https://docs.yjs.dev/api/shared-types/y.text)
            - ✅ [XmlFragment](https://docs.yjs.dev/api/shared-types/y.xmlfragment)
            - ✅ [XmlElement](https://docs.yjs.dev/api/shared-types/y.xmlelement)
            - ✅ [XmlText](https://docs.yjs.dev/api/shared-types/y.xmltext)
    - ✅ [Loro](https://loro.dev/) (preview)
        - ✅ **Containers**
            - ✅ Counter
            - ✅ List
            - ✅ Map
            - ✅ Moveable List
            - ✅ Text
            - ✅ Tree
- ⬜ Studio (admin & developer panel)

## Runtimes

- ✅ [Cloudflare Workers](https://workers.cloudflare.com/)
    - **WebSocket API**
        - ✅ [Hibernation API](https://developers.cloudflare.com/durable-objects/best-practices/websockets/#websocket-hibernation-api) (default, recommended)
        - ✅ [Standard API](https://developers.cloudflare.com/durable-objects/best-practices/websockets/#websocket-standard-api)
    - **State Persistence**
        - ✅ [SQLite-backed Durable Objects](https://developers.cloudflare.com/durable-objects/best-practices/access-durable-objects-storage/#create-sqlite-backed-durable-object-class) (default, recommended)
        - ✅ [Key-value storage-backed Durable Object](https://developers.cloudflare.com/durable-objects/reference/durable-objects-migrations/#create-durable-object-class-with-key-value-storage)
- ✅ [Node.js](https://nodejs.org/)
    - ✅ **PubSubs**
        - ✅ [Redis](https://redis.io/) (preview)
        - ⬜ [MQTT](https://mqtt.org/)
    - ✅ **State Persistence**
        - ✅ In-memory (default)
        - ✅ [Redis](https://redis.io/) (preview)

## Frontends Frameworks

- ✅ [React.js](https://react.dev/)
- ⬜ [Solid.js](https://www.solidjs.com/)
- ⬜ [Vue.js](https://vuejs.org/)
- ⬜ [Svelte](https://svelte.dev/)

## Packages

- [@pluv/io](https://www.npmjs.com/package/@pluv/io) - Server
- [@pluv/client](https://www.npmjs.com/package/@pluv/client) - Framework agnostic client
- [@pluv/react](https://www.npmjs.com/package/@pluv/react) - Integrate @pluv/client with React.js
- [@pluv/platform-pluv](https://www.npmjs.com/package/@pluv/platform-node) - Adapter to run on pluv.io
- [@pluv/platform-cloudflare](https://www.npmjs.com/package/@pluv/platform-cloudflare) - Adapter to run on Cloudflare Workers
- [@pluv/platform-node](https://www.npmjs.com/package/@pluv/platform-node) - Adapter to run on Node.js
- [@pluv/crdt-yjs](https://www.npmjs.com/package/@pluv/crdt-yjs) - Yjs CRDT adapter
- [@pluv/crdt-loro](https://www.npmjs.com/package/@pluv/crdt-loro) - Loro CRDT adapter
- [@pluv/persistence-redis](https://www.npmjs.com/package/@pluv/persistence-redis) - Persistence for storage on distributed systems (Node.js only)
- [@pluv/persistence-cloudflare-transactional-storage](https://www.npmjs.com/package/@pluv/persistence-cloudflare-transactional-storage) - Durable Object persistent state for WebSocket hibernation
- [@pluv/pubsub-redis](https://www.npmjs.com/package/@pluv/pubsub-redis) - PubSub for rooms across distributed systems

## Credits

This software uses the following open source tooling and libraries:

- [Cloudflare Workers](https://workers.cloudflare.com/)
- [Node.js](https://nodejs.org/)
- [React.js](https://reactjs.org/)
- [Yjs](https://yjs.dev/)
- [Loro](https://loro.dev/)

## License

[MIT](https://github.com/pluv-io/pluv/blob/master/LICENSE)
