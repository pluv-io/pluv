---
"@pluv/client": minor
"@pluv/io": minor
---

Users can now have multiple simultaneous connections. Previously, if a user tried to open a connection to a room while already being connected to the room, the new connection would be blocked. Now, when the user opens another connection, the new connection will be opened and initialized with their latest presence.

Users can only have 1 identity and 1 presence, which means that all presence updates will sync across all of that user's connections. This means that even when a user opens multiple connections, they will only appear once in `others`.
