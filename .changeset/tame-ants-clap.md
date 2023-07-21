---
"@pluv/crdt-yjs": patch
"@pluv/client": patch
"@pluv/react": patch
---

* Renamed type `unstable_YObjectValue` to `YObjectValue`;
* Renamed type `unstable_YObject` to `YObject`.
* Re-exported `xmlElement`, `xmlFragment` and `xmlText` from `@pluv/client`.
  ```ts
  import { y } from "@pluv/client"
  // or
  import { y } from "@pluv/react";

  y.xmlElement("MyElement", {});
  y.xmlFragment({});
  y.xmlText("hello world");
  ```
