# @pluv/client

## 0.8.0

### Minor Changes

- fde89cf: added defaults to the client to align it with createPluvClient by default

### Patch Changes

- 5bbfb98: fix not properly handling unauthorized checks
- b85a232: bumped dependencies
- Updated dependencies [b85a232]
  - @pluv/crdt-yjs@0.3.8
  - @pluv/types@0.2.0

## 0.7.0

### Minor Changes

- ae679a8: updated offline presence to be set when reconnecting to a room

### Patch Changes

- 0dd847e: updated storage to be synced when reconnected to the room
- bb2886b: fixed not reconnecting during heartbeat
- 3518a83: bumped dependencies
- Updated dependencies [0dd847e]
- Updated dependencies [bb2886b]
- Updated dependencies [ae679a8]
- Updated dependencies [3518a83]
  - @pluv/crdt-yjs@0.3.7
  - @pluv/types@0.2.0

## 0.6.5

### Patch Changes

- 7ad4967: fixed user's presence not updating locally while offline
- 4535687: fix local yjs doc not updating while disconnected
  - @pluv/crdt-yjs@0.3.6
  - @pluv/types@0.1.6

## 0.6.4

### Patch Changes

- 78fd644: updated readmes with links to the documentation website
- Updated dependencies [78fd644]
  - @pluv/crdt-yjs@0.3.6

## 0.6.3

### Patch Changes

- 850626e: bumped dependencies
- Updated dependencies [850626e]
  - @pluv/crdt-yjs@0.3.5
  - @pluv/types@0.1.6

## 0.6.2

### Patch Changes

- 9ae251d: bumped dependencies
- Updated dependencies [9ae251d]
  - @pluv/crdt-yjs@0.3.4

## 0.6.1

### Patch Changes

- 19433af: updated MockedRoomProvider events to allow partial events
- 74870ee: bumped dependencies
- Updated dependencies [74870ee]
  - @pluv/crdt-yjs@0.3.3
  - @pluv/types@0.1.5

## 0.6.0

### Minor Changes

- e1308e3: changed `PluvClient.createRoom` to have optional options.
- e1308e3: changed `PluvClient.enter` to return the `PluvRoom` that was entered.

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

## 0.5.1

### Patch Changes

- 161e00e: fixed links to other pluv packages in readmes
- f6c0e65: bumped dependencies
- Updated dependencies [161e00e]
- Updated dependencies [f6c0e65]
  - @pluv/crdt-yjs@0.3.1
  - @pluv/types@0.1.3

## 0.5.0

### Minor Changes

- 327a6ef: renamed y.unstable\_\_object to y.object

### Patch Changes

- 78a6119: Fixed MockedRoom not sending storage updates
- 8bf62cb: bumped dependencies
- 7e52685: Bumped dependencies
- b1cb325: Updated dependencies
- 8e97fb2: Updated dependencies
- Updated dependencies [8bf62cb]
- Updated dependencies [7e52685]
- Updated dependencies [b1cb325]
- Updated dependencies [327a6ef]
- Updated dependencies [8e97fb2]
  - @pluv/crdt-yjs@0.3.0
  - @pluv/types@0.1.3

## 0.4.0

### Minor Changes

- 595e66f: added mocked-room for mocking a client-side room for testing

## 0.3.0

### Minor Changes

- 595e66f: added mocked-room for mocking a client-side room for testing

## 0.2.0

### Minor Changes

- 95b5ef8: breaking: update PluvRoom.broadcast api

### Patch Changes

- Updated dependencies [6858682]
  - @pluv/crdt-yjs@0.2.0
  - @pluv/types@0.1.2

## 0.1.3

### Patch Changes

- fe80d7b: added preview disclaimer about breaking changes in the readme
- Updated dependencies [fe80d7b]
  - @pluv/crdt-yjs@0.1.3
  - @pluv/types@0.1.2

## 0.1.2

### Patch Changes

- Updated dependencies [b45d642]
  - @pluv/crdt-yjs@0.1.2

## 0.1.1

### Patch Changes

- 23a7382: Omitted unused `encodedState` param from PluvRoom.
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
