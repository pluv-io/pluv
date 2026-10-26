---
"@pluv/io": major
"@pluv/types": major
"@pluv/client": major
"@pluv/react": major
"@pluv/platform-node": major
"@pluv/platform-cloudflare": major
---

Require authorization for every room connection.

Open (unauthorized) rooms are removed: `createIO` must configure a `treaty` and `secret`, clients must provide an `authEndpoint`, and connections without a valid token are rejected. Session users are always typed from `treaty.user` (at least `{ id: string }`), not `null`.
