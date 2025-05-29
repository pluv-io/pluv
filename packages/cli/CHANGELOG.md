# pluv

## 3.1.2

## 3.1.1

## 3.1.0

## 3.0.0

## 2.3.1

## 2.3.0

## 2.2.8

## 2.2.7

## 2.2.6

## 2.2.5

## 2.2.4

## 2.2.3

## 2.2.2

## 2.2.1

## 2.2.0

## 2.1.0

## 2.0.2

## 2.0.1

## 2.0.0

## 1.0.2

## 1.0.1

## 1.0.0

### Major Changes

- af94706: pluv.io is now stable and production ready!

    With this v1 release, pluv.io will now follow [semantic versioning](https://semver.org/) with more comprehensive release notes for future changes to the library.

    Checkout the [full documentation here](https://pluv.io/docs/introduction) to get started today!

## 0.44.2

## 0.44.1

## 0.44.0

## 0.43.0

## 0.42.0

## 0.41.7

## 0.41.6

## 0.41.5

## 0.41.4

## 0.41.3

## 0.41.2

## 0.41.1

## 0.41.0

## 0.40.2

## 0.40.1

## 0.40.0

## 0.39.1

## 0.39.0

## 0.38.14

## 0.38.13

## 0.38.12

## 0.38.11

## 0.38.10

## 0.38.9

## 0.38.8

## 0.38.7

## 0.38.6

## 0.38.5

## 0.38.4

## 0.38.3

## 0.38.2

## 0.38.1

## 0.38.0

## 0.37.7

## 0.37.6

## 0.37.5

## 0.37.4

## 0.37.3

## 0.37.2

## 0.37.1

## 0.37.0

## 0.36.0

## 0.35.4

## 0.35.3

## 0.35.2

## 0.35.1

## 0.35.0

## 0.34.1

## 0.34.0

## 0.33.0

## 0.32.9

## 0.32.8

## 0.32.7

## 0.32.6

## 0.32.5

## 0.32.4

## 0.32.3

## 0.32.2

## 0.32.1

## 0.32.0

## 0.31.0

## 0.30.2

## 0.30.1

## 0.30.0

## 0.29.0

## 0.28.0

## 0.27.0

## 0.26.0

## 0.25.4

## 0.25.3

## 0.25.2

## 0.25.1

## 0.25.0

## 0.24.1

## 0.24.0

## 0.23.0

## 0.22.0

## 0.21.1

## 0.21.0

## 0.20.0

## 0.19.0

## 0.18.0

## 0.17.3

### Patch Changes

- 04c45f3: Fixed TypeScript config issues causing certain build discepencies.

## 0.17.2

### Patch Changes

- 1a134ae: Fix the build command incorrectly outputting build artifacts it shouldn't have.

## 0.17.1

### Patch Changes

- 42707d2: Updated the pluv cli's `build` command so that only the pluv entry file and all necessary dependencies are type-checked, instead of all TypeScript files in the project workspace.

## 0.17.0

## 0.16.3

## 0.16.2

## 0.16.1

## 0.16.0

## 0.15.0

### Minor Changes

- 59b5d26: Added support for .env files.

    `pluv.config.js`

    ```js
    module.exports = {
        // Use key-value pairs
        env: {
            MY_SECRET_KEY: "abc123",
        },

        // Alternatively, use a file path to a .env file
        env: "./.env",

        // Or don't provide an env property in your config at all. Defaults to "./.env"
    };
    ```

## 0.14.1

### Patch Changes

- 1158176: Fix environment variables not correctly applying when building with the pluv cli.

## 0.14.0

### Minor Changes

- b23e57f: Added support for environment variables in the pluv cli.

    Example `pluv.config.json` file:

    ```json
    {
        "env": {
            "MY_SECRET_KEY": "abc123",
            "MY_OTHER_SECRET_KEY": "def456"
        },
        "input": "./pluv.ts",
        "outDir": "./.pluv"
    }
    ```

## 0.13.0

## 0.12.3

### Patch Changes

- da9f600: Upgraded dependencies

## 0.12.2

### Patch Changes

- 259a7da: Bumped dependencies

## 0.12.1

## 0.12.0

## 0.11.1

### Patch Changes

- 74b3061: Bumped minor and patch dependencies.

## 0.11.0

## 0.10.3

## 0.10.2

## 0.8.1

## 0.8.0

### Minor Changes

- f43f1cc: Change packages to all be versioned together for consistency.

## 0.7.0

### Minor Changes

- 6d03186: Rebuilt the pluv cli.

    - Removed existing `create-pluv-app` functionality.
    - Added new `build` command to support eventual hosting.

## 0.6.1

### Patch Changes

- 8fba48b: fix including incorrect dependency
- 8997c65: bumped dependencies
- Updated dependencies [8fba48b]
- Updated dependencies [8997c65]
    - @pluv/types@0.2.2

## 0.6.0

### Minor Changes

- 829d31b: Added support for defining persistant frontend storage for rooms via a new `addons` option on rooms.

    This also introduces the first new addon `@pluv/addon-indexeddb`, which is more-or-less the equivalent to `y-indexeddb` which you can install like so:

    ```
    npm install @pluv/addon-indexeddb
    ```

    To use this new addon, simply pass it to options when creating a room:

    ```ts
    import { addonIndexedDB } from "@pluv/addon-indexeddb";
    import { createClient } from "@pluv/client";

    const client = createClient({
        // ...
    });

    const room = client.createRoom("my-new-room", {
        addons: [
            // Define your addons in an array like so
            addonIndexedDB(),
        ],
    });
    ```

    Or when using `@pluv/react`:

    ```ts
    const PluvRoom = createRoomBundle({
        // ...
        addons: [
            // Define your addons in an array like so
            addonIndexedDB(),
        ],
    });
    ```

### Patch Changes

- 8d11672: bumped dependencies to latest
- Updated dependencies [8d11672]
    - @pluv/types@0.2.1

## 0.5.0

### Minor Changes

- a3e8f15: Updated cli to use latest pluv packages.

## 0.4.6

### Patch Changes

- a5f7176: fix(deps): update dependency @pluv/platform-node to ^0.2.0

## 0.4.5

### Patch Changes

- f2c3707: fix(deps): update dependency @pluv/io to ^0.4.0
- b85a232: bumped dependencies
    - @pluv/types@0.2.0

## 0.4.4

### Patch Changes

- ef162ad: chore(deps): update nextjs monorepo to v13.3.1
- 41943cf: bumped dependencies
- 3518a83: bumped dependencies
- Updated dependencies [0dd847e]
- Updated dependencies [bb2886b]
- Updated dependencies [ae679a8]
    - @pluv/types@0.2.0

## 0.4.3

### Patch Changes

- 78fd644: updated readmes with links to the documentation website

## 0.4.2

### Patch Changes

- 850626e: bumped dependencies
- Updated dependencies [850626e]
    - @pluv/types@0.1.6

## 0.4.1

### Patch Changes

- 9fd8779: chore(deps): update nextjs monorepo to v13.3.0
- 77069a1: replaced chalk for kleur
    - @pluv/types@0.1.5

## 0.4.0

### Minor Changes

- a0160cf: bumped @pluv/io

### Patch Changes

- 74870ee: bumped dependencies
- Updated dependencies [74870ee]
    - @pluv/types@0.1.5

## 0.3.4

### Patch Changes

- 57ae13f: bumped dependencies
    - @pluv/types@0.1.4

## 0.3.3

### Patch Changes

- 9516a4e: updated typescript to 5.0
- 7b6da1c: bumped dependencies
- e9c1514: bumped dependencies
- 9d1829c: chore: bumped dependencies
- Updated dependencies [9516a4e]
- Updated dependencies [7b6da1c]
- Updated dependencies [e9c1514]
    - @pluv/types@0.1.4

## 0.3.2

### Patch Changes

- 9c30e96: bumped dependencies
- 161e00e: fixed links to other pluv packages in readmes
- f6c0e65: bumped dependencies
    - @pluv/types@0.1.3

## 0.3.1

### Patch Changes

- fa2bcf2: fix(deps): update dependency @pluv/react to ^0.5.0
- 797ae60: chore(deps): update nextjs monorepo to v13.2.4

## 0.3.0

### Minor Changes

- 10e715d: fix(deps): update dependency @pluv/react to ^0.4.0
- 327a6ef: renamed y.unstable\_\_object to y.object
- 0f35eae: fix(deps): update dependency @pluv/react to ^0.3.0

### Patch Changes

- 8bf62cb: bumped dependencies
- 7e52685: Bumped dependencies
- b1cb325: Updated dependencies
- 1a15739: chore(deps): update nextjs monorepo to v13.2.1
- 106ee81: chore(deps): update nextjs monorepo to v13.2.3
- e7360b6: chore(deps): update nextjs monorepo to v13.2.2
- 8e97fb2: Updated dependencies
- Updated dependencies [8bf62cb]
- Updated dependencies [7e52685]
- Updated dependencies [8e97fb2]
    - @pluv/types@0.1.3

## 0.2.3

### Patch Changes

- 6d2903f: chore(deps): update nextjs monorepo to v13.1.4
- 629b1f1: chore(deps): update nextjs monorepo to v13.1.5
- 1aa2216: fix(deps): update dependency @pluv/react to ^0.2.0
- 7280a83: chore(deps): update nextjs monorepo to v13.1.3

## 0.2.2

### Patch Changes

- 6d2903f: chore(deps): update nextjs monorepo to v13.1.4
- 629b1f1: chore(deps): update nextjs monorepo to v13.1.5
- 1aa2216: fix(deps): update dependency @pluv/react to ^0.2.0
- 7280a83: chore(deps): update nextjs monorepo to v13.1.3

## 0.2.1

### Patch Changes

- fe80d7b: added preview disclaimer about breaking changes in the readme
- Updated dependencies [fe80d7b]
    - @pluv/types@0.1.2

## 0.2.0

### Minor Changes

- 87bd206: updated pluv dependencies in template

## 0.1.1

### Patch Changes

- 24016e6: Updated dependencies
- Updated dependencies [24016e6]
    - @pluv/types@0.1.1

## 0.1.0

### Minor Changes

- a22f525: Added documentation

### Patch Changes

- Updated dependencies [a22f525]
    - @pluv/types@0.1.0
