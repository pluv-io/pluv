---
"pluv": minor
---

Added support for environment variables in the pluv cli.

Example `pluv.config.json` file:

```json
{
    "env": {
        "MY_SECRET_KEY": "abc123",
        "MY_OTHER_SECRET_KEY": "def456",
    },
    "input": "./pluv.ts",
    "outDir": "./.pluv",
}
```
