> **Disclaimer:**
> This package is currently in preview and may have breaking changes between versions. Please wait for a `v1.0.0` stable release before using this in production.

<h1 align="center">
  <br />
  <img src="https://github.com/pluv-io/pluv/blob/master/assets/pluv-icon-192x192.png?raw=true" alt="Pluv.IO" width="180" style="border-radius:16px" />
  <br />
  <a href="https://pluv.io/docs/introduction">Pluv.IO (preview)</a>
  <br />
</h1>

<h3 align="center">Multi-platform, E2E type-safe realtime packages</h3>
<h4 align="center">💕 Inspired by <a href="https://trpc.io">trpc</a> 💕 <a href="https://docs.yjs.dev/">yjs</a> 💕 and <a href="https://developers.cloudflare.com/">Cloudflare</a> 💕 </h4>

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

<p align="center">
  <a href="#intro">Intro</a> •
  <a href="#usage">Usage</a> •
  <a href="#related">Related</a> •
  <a href="#credits">Credits</a> •
  <a href="#license">License</a>
</p>

## Intro

pluv.io allows you to more easily build real-time collaborative experiences with a fully end-to-end type-safe api and the ecosystem of existing CRDT implementations such as **[yjs](https://docs.yjs.dev/)**.

**👉 See full documentation on [pluv.io](https://pluv.io/docs/introduction). 👈**

### Features

- ✅ Automatic type safety
- ✅ Basic events
- ✅ Rooms
- ✅ Authentication
- ✅ Awareness + Presence
- ✅ [CRDTs](https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type)
  - ✅ [Yjs](https://docs.yjs.dev/)
    - ✅ **Shared Types**
      - ✅ [Map](https://docs.yjs.dev/api/shared-types/y.map)
      - ✅ [Array](https://docs.yjs.dev/api/shared-types/y.array)
      - ✅ [Text](https://docs.yjs.dev/api/shared-types/y.text)
      - ✅ [XmlFragment](https://docs.yjs.dev/api/shared-types/y.xmlfragment)
      - ✅ [XmlElement](https://docs.yjs.dev/api/shared-types/y.xmlelement)
      - ✅ [XmlText](https://docs.yjs.dev/api/shared-types/y.xmltext)
  - ✅ [Loro](https://loro.dev/)
    - ✅ **Containers**
        - ✅ List
        - ✅ Map
        - ✅ Text
        - ⬜ Tree
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

### Documentation

Documentation is available at [pluv.io](https://pluv.io/docs/introduction).

## Related

- [@pluv/client](https://www.npmjs.com/package/@pluv/client) - Framework agnostic client
- [@pluv/crdt-loro](https://www.npmjs.com/package/@pluv/crdt-loro) - Loro CRDT for Pluv.IO
- [@pluv/crdt-yjs](https://www.npmjs.com/package/@pluv/crdt-yjs) - Yjs CRDT for Pluv.IO
- [@pluv/persistance-redis](https://www.npmjs.com/package/@pluv/persistance-redis) - Persistance for storage on distributed systems (Node.js only)
- [@pluv/platform-cloudflare](https://www.npmjs.com/package/@pluv/platform-cloudflare) - Adapter to run @pluv/io on Cloudflare Workers
- [@pluv/platform-node](https://www.npmjs.com/package/@pluv/platform-node) - Adapter to run @pluv/io on Node.js
- [@pluv/pubsub-redis](https://www.npmjs.com/package/@pluv/pubsub-redis) - PubSub for rooms across distributed systems
- [@pluv/react](https://www.npmjs.com/package/@pluv/react) - Integrate @pluv/client with React.js

## Credits

This software uses the following open source tooling and libraries:

- [Loro](https://loro.dev/)
- [Yjs](https://yjs.dev/)
- [Node.js](https://nodejs.org/)
- [Cloudflare Workers](https://workers.cloudflare.com/)
- [ioredis](https://github.com/luin/ioredis)
- [React.js](https://reactjs.org/)

## License

[MIT](https://github.com/pluv-io/pluv/blob/master/LICENSE)
