# `@repo/docs`

Documentation site for [pluv.io](https://pluv.io), built with [TanStack Start](https://tanstack.com/start) and [Fumadocs](https://fumadocs.dev). Deployed on [Cloudflare Workers](https://developers.cloudflare.com/workers/).

## Development

```bash
pnpm install
pnpm --filter @repo/docs dev
```

Open:

- Docs: [http://localhost:3000/docs](http://localhost:3000/docs)
- LLM index: [http://localhost:3000/llms.txt](http://localhost:3000/llms.txt)
- LLM full docs: [http://localhost:3000/llms-full.txt](http://localhost:3000/llms-full.txt)

## Scripts

| Script       | Description                                    |
| ------------ | ---------------------------------------------- |
| `dev`        | Start the Vite development server              |
| `build`      | Build the production app                       |
| `preview`    | Preview the production build (Workers runtime) |
| `deploy`     | Build and deploy to Cloudflare Workers         |
| `cf:typegen` | Generate Cloudflare Workers types              |
| `typecheck`  | Generate MDX types and run `tsc`               |
| `lint`       | Run ESLint                                     |

## Deploy

```bash
pnpm --filter @repo/docs deploy
```
