---
"@pluv/io": major
"@pluv/types": major
"@pluv/client": major
"@pluv/react": major
"@pluv/platform-node": major
"@pluv/platform-cloudflare": major
"@pluv/platform-pluv": major
---

Require authorization for every room connection.

Open (unauthorized) rooms are removed: `createIO` must configure `authorize`, clients must provide an `authEndpoint`, and connections without a valid token are rejected. Session users are always typed from your authorize schema (at least `{ id: string }`), not `null`.
