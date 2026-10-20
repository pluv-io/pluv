# `@repo/docs`

Documentation site for [pluv.io](https://pluv.io). Built with [TanStack Start](https://tanstack.com/start) and [Fumadocs](https://fumadocs.dev). Deployed on [Cloudflare Workers](https://developers.cloudflare.com/workers/).

| Environment | URL                                                  | Deploy trigger                                                      |
| ----------- | ---------------------------------------------------- | ------------------------------------------------------------------- |
| Production  | [docs.pluv.io](https://docs.pluv.io)                 | Push to `docs-prod` (including after **Promote Docs (Production)**) |
| Staging     | [staging.docs.pluv.io](https://staging.docs.pluv.io) | Push to `main` (docs paths)                                         |

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

| Script           | Description                                          |
| ---------------- | ---------------------------------------------------- |
| `dev`            | Start the Vite development server                    |
| `build`          | Build the production app                             |
| `preview`        | Preview the production build (Workers runtime)       |
| `deploy`         | Build and deploy to production (`docs.pluv.io`)      |
| `deploy:prod`    | Same as `deploy`                                     |
| `deploy:staging` | Build and deploy to staging (`staging.docs.pluv.io`) |
| `cf:typegen`     | Generate Cloudflare Workers env/runtime types        |
| `typecheck`      | Run `cf:typegen`, generate MDX types, run `tsc`      |
| `lint`           | Run ESLint                                           |

## Deploy

**Staging** (from repo root):

```bash
CLOUDFLARE_ENV=staging VITE_SITE_URL=https://staging.docs.pluv.io VITE_DOCS_STAGING=true \
  pnpm --filter @repo/docs run deploy:staging
```

**Production**:

```bash
pnpm --filter @repo/docs run deploy:prod
```

## Production releases

Production tracks the **`docs-prod`** branch. Pushes to `docs-prod` run the production deploy job in the **Docs** workflow.

1. Verify changes on staging (`main` auto-deploys to `staging.docs.pluv.io`).
2. In **Docs** → **Run workflow**, choose **promote** to fast-forward `docs-prod` to `main` (or set `source_ref`). That push triggers production deploy.
3. Optionally tag the release commit: `git tag docs/vYYYY.MM.DD` and push tags.

You can also fast-forward `docs-prod` locally and push. Use **redeploy-staging** or **redeploy-production** to redeploy without moving a branch.

### Bootstrap `docs-prod`

Create `docs-prod` at the commit that matches the current production Worker deploy (Cloudflare dashboard → `pluv-docs` → Deployments, or the last successful prod deploy on `main` before this split):

```bash
git branch docs-prod <commit-sha>
git push -u origin docs-prod
```

The first staging deploy creates `staging.docs.pluv.io` (DNS + TLS) automatically, same as `docs.pluv.io`, as long as `pluv.io` is on the deploy account and nothing else already owns that hostname.
