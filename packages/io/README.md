> **Disclaimer:**
> This package is currently in preview and may have breaking changes between versions. Please wait for a `v1.0.0` stable release before using this in production.

<h1 align="center">
  <br>
  <img src="https://github.com/pluv-io/pluv/blob/master/assets/pluv-icon-192x192.png?raw=true" alt="Pluv.IO" width="180" style="border-radius:16px">
  <br>
  Pluv.IO (preview)
  <br>
</h1>

<h3 align="center">Multi-platform, E2E type-safe realtime packages</h3>
<h4 align="center">💕 Inspired by <a href="https://trpc.io">trpc</a> 💕 Built with <a href="https://docs.yjs.dev/">yjs</a> 💕</h4>

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
  <img src="https://img.shields.io/badge/website-coming%20soon!-blue" alt="Website coming soon!" />
</p>

<p align="center">
  <img src="https://badgen.net/badge/-/TypeScript?icon=typescript&label&labelColor=blue&color=555555" alt="TypeScript">
  <a href="https://openbase.com/js/@pluv/io?utm_source=embedded&amp;utm_medium=badge&amp;utm_campaign=rate-badge">
    <img src="https://badges.openbase.com/js/featured/@pluv/io.svg?token=FdWfpo90mCUb7InAjDG0KeXM/uH+KdHK3us2pNRgWf0=" alt="Featured on Openbase" />
  </a>
</p>

<p align="center">
  <a href="#intro">Intro</a> •
  <a href="#usage">Usage</a> •
  <a href="#related">Related</a> •
  <a href="#credits">Credits</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <img src="https://github.com/pluv-io/pluv/blob/master/assets/demo-events.gif?raw=true" alt="Demo" />
</p>

## Intro

Pluv.IO allows you to build real-time collaborate features with a fully end-to-end type-safe api.

### Why?

So you can do this:

```tsx
usePluvEvent("RECEIVE_MESSAGE", ({ data }) => {
  setMessages([...messages, data.message]);
});

usePluvBroadcast({
  type: "SEND_MESSAGE",
  data: { message: "Hello world!" },
});
```

And this:

```tsx
const [myCursor, updatePresence] = usePluvMyPresence((me) => me.presence.cursor);
const cursors = usePluvOthers((others) => {
  return others.map((other) => other.presence.cursor);
});

useEffect(() => {
  const updateCursor = (e: MouseEvent) => {
    updatePresence({ cursor: { x: e.pageX, y: e.pageY } });
  };

  window.addEventListener("mousemove", updateCursor);

  return () => {
    window.removeEventListener("mousemove", updateCursor);
  };
}, [updatePresence]);

return (
  <div>
    <div style={{ top: myCursor?.y, left: myCursor?.x }} />
    {cursors.map((cursor, i) => (
      <div key={i} style={{ top: cursor?.y, left: cursor?.x }} />
    ))}
  </div>
);
```

Also this:


```tsx
const [messages, sharedType] = usePluvStorage("messages");

sharedType?.push(["Hello world!"]);

return (
  <div>
    {messages?.map((message, i) => (
      <div key={i}>{message}</div>
    ))}
  </div>
);
```

And more. With **E2E type-safety**, **great intellisense** and the **[yjs](https://docs.yjs.dev/) ecosystem**.

### Features

- ✅ Automatic type safety
- ✅ Basic events
- ✅ Rooms
- ✅ Authentication
- ✅ Awareness + Presence
- ✅ [CRDTs](https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type) (with [Yjs](https://docs.yjs.dev/))
  - ✅ **Shared Types**
    - ✅ [Map](https://docs.yjs.dev/api/shared-types/y.map)
    - ✅ [Array](https://docs.yjs.dev/api/shared-types/y.array)
    - ✅ [Text](https://docs.yjs.dev/api/shared-types/y.text)
    - ✅ [XmlFragment](https://docs.yjs.dev/api/shared-types/y.xmlfragment)
    - ✅ [XmlElement](https://docs.yjs.dev/api/shared-types/y.xmlelement)
    - ✅ [XmlText](https://docs.yjs.dev/api/shared-types/y.xmltext)
- ⬜ Studio (admin & developer panel)

### Runtimes

- ✅ [Cloudflare Workers](https://workers.cloudflare.com/)
- ✅ [Node.js](https://nodejs.org/)
  - ✅ **PubSubs**
    - ✅ [Redis](https://redis.io/)
    - ⬜ [RabbitMQ](https://www.rabbitmq.com/)
    - ⬜ [Kafka](https://kafka.apache.org/)
  - ✅ **CRDT State Persistance**
    - ✅ [Redis](https://redis.io/)
    - ⬜ [Prisma](https://www.prisma.io/)

### Frontends

- ✅ [React.js](https://beta.reactjs.org/)
- ⬜ [Vue.js](https://vuejs.org/)
- ⬜ [Svelte](https://svelte.dev/)

## Usage

Before diving into documentation, check out usage instructions for your selected platform:

> **Note:**
> `@pluv/io`, `@pluv/client`, `@pluv/crdt-yjs` and `@pluv/react` all require [yjs](https://docs.yjs.dev/) as a peer dependency.

### Platforms

* [Cloudflare](https://github.com/pluv-io/pluv/blob/master/docs/cloudflare-support.md)
* [Node.js](https://github.com/pluv-io/pluv/blob/master/docs/nodejs-support.md)

### Documentation

* [Authentication](https://github.com/pluv-io/pluv/blob/master/docs/authentication.md)
* [CRDT Storage](https://github.com/pluv-io/pluv/blob/master/docs/crdt-storage.md)
* [Creating Rooms](https://github.com/pluv-io/pluv/blob/master/docs/creating-rooms.md)
* [`createIO` API](https://github.com/pluv-io/pluv/blob/master/docs/create-io-api.md)
* [Custom Events](https://github.com/pluv-io/pluv/blob/master/docs/custom-events.md)
* [Presence](https://github.com/pluv-io/pluv/blob/master/docs/presence.md)
* [PubSubs and Persistance](https://github.com/pluv-io/pluv/blob/master/docs/pubsubs-and-persistance.md)
* [React API](https://github.com/pluv-io/pluv/blob/master/docs/react-api.md)

## Related

- [@pluv/client](https://www.npmjs.com/package/@pluv/client) - Framework agnostic client
- [@pluv/crdt-yjs](https://www.npmjs.com/package/@pluv/crdt-yjs) - Yjs for Pluv.IO
- [@pluv/persistance-redis](https://www.npmjs.com/package/@pluv/persistance-redis) - Persistance for storage on distributed systems (Node.js only)
- [@pluv/platform-cloudflare](https://www.npmjs.com/package/@pluv/platform-cloudflare) - Adapter to run @pluv/io on Cloudflare Workers
- [@pluv/platform-node](https://www.npmjs.com/package/@pluv/platform-node) - Adapter to run @pluv/io on Node.js
- [@pluv/pubsub-redis](https://www.npmjs.com/package/@pluv/pubsub-redis) - PubSub for rooms across distributed systems
- [@pluv/react](https://www.npmjs.com/package/@pluv/react) - Integrate @pluv/client with React.js

## Credits

This software uses the following open source tooling and libraries:

- [Yjs](https://yjs.dev/)
- [Node.js](https://nodejs.org/)
- [Cloudflare Workers](https://workers.cloudflare.com/)
- [ioredis](https://github.com/luin/ioredis)
- [React.js](https://reactjs.org/)

## License

MIT
