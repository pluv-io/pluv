---
"@pluv/types": major
"@pluv/client": major
"@pluv/react": major
---

Room failures (procedure throws, size limits, rejected registers) now fire `room.subscribe.error` / `useRoomError(callback)` — a callback, not a stored last error.
