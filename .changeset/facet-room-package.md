---
"@pluv/platform": minor
---

Add `@pluv/platform`. Pass `platformPluv()` to `createIO().platform()`.

```ts
import { createIO } from "@pluv/io";
import { platformPluv } from "@pluv/platform";

const io = createIO().platform(platformPluv());
```
