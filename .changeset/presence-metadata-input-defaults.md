---
"@pluv/client": minor
"@pluv/react": minor
---

Don't require defaulted presence and metadata fields when joining a room.

If a field has a schema default, TypeScript used to still demand it on `initialPresence` and `metadata`. You can omit those fields now, and the defaults are applied when the room is created.
