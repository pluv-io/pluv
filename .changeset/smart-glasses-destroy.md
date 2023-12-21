---
"pluv": minor
---

Added support for .env files.

`pluv.config.js`
```js
module.exports = {
    // Use key-value pairs
    "env": {
        MY_SECRET_KEY: "abc123",
    },

    // Alternatively, use a file path to a .env file
    "env": "./.env",

    // Or don't provide an env property in your config at all. Defaults to "./.env"
};
```
