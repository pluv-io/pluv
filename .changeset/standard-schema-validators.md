---
"@pluv/types": major
"@pluv/io": major
"@pluv/client": major
"@pluv/react": major
"@pluv/platform-node": major
"@pluv/platform-cloudflare": major
"@pluv/platform-pluv": major
---

Accept any Standard Schema validator for authorize, presence, metadata, and procedure inputs.

Zod still works as before on recent versions (3.24+/4). You can also use Valibot, ArkType, or other Standard Schema–compatible libraries. The old `InputZodLike` duck type (`{ parse, _input }`) is removed — schemas must expose `~standard.validate`.
