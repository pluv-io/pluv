---
"@pluv/client": minor
"@pluv/io": minor
"@pluv/crdt": minor
"@pluv/crdt-yjs": minor
"@pluv/crdt-loro": minor
"@pluv/types": minor
---

Live storage updates send only the new operations, not the whole document.

Other clients in the room receive the change itself. Saved storage is still the full snapshot. A client that is missing changes catches up from the server, including when it connects or reconnects.

An update that depends on changes the server does not have yet is not forwarded to the room. The server asks the sender for that missing history.
