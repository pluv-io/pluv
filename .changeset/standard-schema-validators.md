---
"@pluv/types": major
"@pluv/io": major
"@pluv/client": major
"@pluv/react": major
"@pluv/platform-node": major
"@pluv/platform-cloudflare": major
"@pluv/platform-pluv": major
---

User, presence, metadata, and event inputs all take the same validator libraries:

- Zod 4.2+
- ArkType

The old Zod-like `{ parse, _input }` duck type no longer works.
