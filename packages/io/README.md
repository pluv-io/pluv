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
  <img src="https://badgen.net/badge/-/TypeScript?icon=typescript&label&labelColor=blue&color=555555" alt="TypeScript">
  <a href="https://commitizen.github.io/cz-cli/">
    <img src="https://img.shields.io/badge/commitizen-friendly-brightgreen.svg" alt="Commitizen friendly" />
  </a>
  <img src="https://img.shields.io/badge/docs-coming%20soon!-blue" alt="Docs coming soon!" />
</p>

<p align="center">
  <a href="#intro">Intro</a> •
  <a href="#usage">Usage</a> •
  <a href="#related">Related</a> •
  <a href="#credits">Credits</a> •
  <a href="#license">License</a>
</p>

<img src="https://github.com/pluv-io/pluv/blob/master/assets/demo-events.gif?raw=true" alt="Demo" />

<h3 align="center">Documentation Website coming soon!</h3>

## Intro

Pluv.IO allows you to build real-time collaborate features with a fully end-to-end type-safe api.

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
    - ⬜ [XmlFragment](https://docs.yjs.dev/api/shared-types/y.xmlfragment)
    - ⬜ [XmlElement](https://docs.yjs.dev/api/shared-types/y.xmlelement)
    - ⬜ [XmlText](https://docs.yjs.dev/api/shared-types/y.xmltext)
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

> **Note**
> `@pluv/io`, `@pluv/client`, `@pluv/crdt-yjs` and `@pluv/react` all require [yjs](https://docs.yjs.dev/) as a peer dependency.

### Platforms

* [Cloudflare](https://github.com/pluv-io/pluv/blob/master/docs/cloudflare-support.md)
* [Node.js](https://github.com/pluv-io/pluv/blob/master/docs/nodejs-support.md)

### Documentation

* [Authentication](https://github.com/pluv-io/pluv/blob/master/docs/authentication.md)
* [CRDT Storage](https://github.com/pluv-io/pluv/blob/master/docs/crdt-storage.md)
* [Creating Rooms](https://github.com/pluv-io/pluv/blob/master/docs/creating-rooms.md)
* [Custom Events](https://github.com/pluv-io/pluv/blob/master/docs/custom-events.md)
* [Presence](https://github.com/pluv-io/pluv/blob/master/docs/presence.md)
* [PubSubs and Persistance](https://github.com/pluv-io/pluv/blob/master/docs/pubsubs-and-persistance.md)
* [React API](https://github.com/pluv-io/pluv/blob/master/docs/react-api.md)

## Related

- [@pluv/client](https://github.com/pluv-io/pluv/tree/master/packages/client) - Framework agnostic client
- [@pluv/crdt-yjs](https://github.com/pluv-io/pluv/tree/master/packages/crdt-yjs) - Yjs for Pluv.IO
- [@pluv/persistance-redis](https://github.com/pluv-io/pluv/tree/master/packages/persistance-redis) - Persistance for storage on distributed systems (Node.js only)
- [@pluv/platform-cloudflare](https://github.com/pluv-io/pluv/tree/master/packages/platform-cloudflare) - Adapter to run @pluv/io on Cloudflare Workers
- [@pluv/platform-node](https://github.com/pluv-io/pluv/tree/master/packages/platform-node) - Adapter to run @pluv/io on Node.js
- [@pluv/pubsub-redis](https://github.com/pluv-io/pluv/tree/master/packages/pubsub-redis) - PubSub for rooms across distributed systems
- [@pluv/react](https://github.com/pluv-io/pluv/tree/master/packages/react) - Integrate @pluv/client with React.js

## Credits

This software uses the following open source tooling and libraries:

- [Yjs](https://yjs.dev/)
- [Node.js](https://nodejs.org/)
- [Cloudflare Workers](https://workers.cloudflare.com/)
- [ioredis](https://github.com/luin/ioredis)
- [React.js](https://reactjs.org/)

## License

MIT
