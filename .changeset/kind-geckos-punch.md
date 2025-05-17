---
"@pluv/crdt-yjs": minor
---

Update `yjs.awareness` and `yjs.provider` to allow for a `field` parameter to use awareness on a nested presence field.

```ts
createClient({
    presence: z.object({
        topField: z.number(),
        forAwareness: z.object({
            nestedField: z.number(),
        }),
    }),
});

yjs.provider({
    // ...
    // Optional field to use a nested field, instead of the presence root
    field: "forAwareness",
});

yjs.awareness({
    // ...
    // Optional field to use a nested field, instead of the presence root
    field: "forAwareness",
});
```

This allows better integrations with [lexical](https://lexical.dev), since they have their own presence types.

```tsx
createClient({
    presence: z.object({
        topField: z.number(),
        lexical: z.any(),
    }),
});

yjs.provider({ field: "lexical", /* ... */ });
```