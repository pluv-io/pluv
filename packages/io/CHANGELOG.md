# @pluv/io

## 0.5.0

### Minor Changes

- ae4e1f1: added platform-specific contexts to expose env in cloudflare and req in node.js

## 0.4.2

### Patch Changes

- 8917309: fixed PluvIO listeners onRoomDeleted and onStorageUpdated not working when additional events were added

## 0.4.1

### Patch Changes

- b85a232: bumped dependencies
- Updated dependencies [b85a232]
  - @pluv/crdt-yjs@0.3.8
  - @pluv/types@0.2.0

## 0.4.0

### Minor Changes

- bb2886b: allow sending multiple output types (broadcast, self, sync) per event
- ae679a8: updated offline presence to be set when reconnecting to a room

### Patch Changes

- 41943cf: bumped dependencies
- 0dd847e: updated storage to be synced when reconnected to the room
- 3518a83: bumped dependencies
- Updated dependencies [0dd847e]
- Updated dependencies [bb2886b]
- Updated dependencies [ae679a8]
- Updated dependencies [3518a83]
  - @pluv/crdt-yjs@0.3.7
  - @pluv/types@0.2.0

## 0.3.9

### Patch Changes

- abb3622: fixed @pluv/io yjs doc becoming unresponsive when the last user leaves on a cloudflare worker

## 0.3.8

### Patch Changes

- bcf1c3e: purge empty rooms before joining a new room

## 0.3.7

### Patch Changes

- ecc4040: added ability to set debug when room is created

## 0.3.6

### Patch Changes

- a7e2980: deleted links to docs that were removed

## 0.3.5

### Patch Changes

- 78fd644: updated readmes with links to the documentation website
- Updated dependencies [78fd644]
  - @pluv/crdt-yjs@0.3.6

## 0.3.4

### Patch Changes

- 850626e: bumped dependencies
- Updated dependencies [850626e]
  - @pluv/crdt-yjs@0.3.5
  - @pluv/types@0.1.6

## 0.3.3

### Patch Changes

- 77069a1: replaced chalk for kleur
  - @pluv/crdt-yjs@0.3.4
  - @pluv/types@0.1.5

## 0.3.2

### Patch Changes

- 9ae251d: bumped dependencies
- Updated dependencies [9ae251d]
  - @pluv/crdt-yjs@0.3.4

## 0.3.1

### Patch Changes

- 74870ee: bumped dependencies
- Updated dependencies [74870ee]
  - @pluv/crdt-yjs@0.3.3
  - @pluv/types@0.1.5

## 0.3.0

### Minor Changes

- c5567f1: renamed IORoom.room to IORoom.id
- c5567f1: updated IORoom.broadcast to have the same function signature as PluvRoom.broadcast

### Patch Changes

- @pluv/crdt-yjs@0.3.2
- @pluv/types@0.1.4

## 0.2.6

### Patch Changes

- 9516a4e: updated typescript to 5.0
- 7b6da1c: bumped dependencies
- e9c1514: bumped dependencies
- 9d1829c: chore: bumped dependencies
- Updated dependencies [9516a4e]
- Updated dependencies [7b6da1c]
- Updated dependencies [e9c1514]
- Updated dependencies [9d1829c]
  - @pluv/crdt-yjs@0.3.2
  - @pluv/types@0.1.4

## 0.2.5

### Patch Changes

- 161e00e: fixed links to other pluv packages in readmes
- f6c0e65: bumped dependencies
- Updated dependencies [161e00e]
- Updated dependencies [f6c0e65]
  - @pluv/crdt-yjs@0.3.1
  - @pluv/types@0.1.3

## 0.2.4

### Patch Changes

- 8bf62cb: bumped dependencies
- 7e52685: Bumped dependencies
- 3b7b17a: docs: corrected readme typos
- b1cb325: Updated dependencies
- 8e97fb2: Updated dependencies
- Updated dependencies [8bf62cb]
- Updated dependencies [7e52685]
- Updated dependencies [b1cb325]
- Updated dependencies [327a6ef]
- Updated dependencies [8e97fb2]
  - @pluv/crdt-yjs@0.3.0
  - @pluv/types@0.1.3

## 0.2.3

### Patch Changes

- 95b5ef8: breaking: update PluvRoom.broadcast api
- e23fbbe: update demo gif in README
- Updated dependencies [6858682]
  - @pluv/crdt-yjs@0.2.0
  - @pluv/types@0.1.2

## 0.2.2

### Patch Changes

- fe80d7b: added preview disclaimer about breaking changes in the readme
- Updated dependencies [fe80d7b]
  - @pluv/crdt-yjs@0.1.3
  - @pluv/types@0.1.2

## 0.2.1

### Patch Changes

- b45d642: Fixed links on README
- 203dfee: Updated README
- Updated dependencies [b45d642]
  - @pluv/crdt-yjs@0.1.2

## 0.2.0

### Minor Changes

- 23a7382: Added `initialStorage` param to `createIO` to set initialStorage state of room.
- 39271d4: Added support for IORoom listeners to get current storage state.

### Patch Changes

- 24016e6: Updated dependencies
- Updated dependencies [24016e6]
  - @pluv/crdt-yjs@0.1.1
  - @pluv/types@0.1.1

## 0.1.0

### Minor Changes

- a22f525: Added documentation

### Patch Changes

- Updated dependencies [a22f525]
  - @pluv/crdt-yjs@0.1.0
  - @pluv/types@0.1.0
