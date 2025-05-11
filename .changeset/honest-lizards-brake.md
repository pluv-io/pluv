---
"@pluv/crdt-loro": patch
"@pluv/crdt-yjs": patch
---

Updated deprecation warnings to read that features will be removed in v3 instead of v2.

Due to an [extremely unfortunate bug in changesets](https://github.com/changesets/changesets/issues/1011), minor and patch changes will create major releases. This caused an unintended v2 release that had no breaking changes. To avoid backtracking and deleting deprecated functionalities right away, the deprecation warnings have been updated so that those APIs will be removed in v3 instead of v2.
