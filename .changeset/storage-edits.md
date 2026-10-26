---
"@pluv/io": minor
---

Add `onStorageEdits`. It reports changes to a room's document, about once a second. Each change has the update. The user and the operator come from the session. The procedure is the name the client sent with the update, or the procedure the server ran. A change that did not come from either is still reported, with a null user, operator, and procedure.

```ts
onStorageEdits({ context, room, changes }) => {
    // changes: { update, user, operator, procedure }[]
}
```

Do not rebuild the document from this listener. It does not report every update in the document. Use the saved snapshot for the full document, and handle the gaps yourself.

- The document already stored when the room opens is never reported.
- An update that arrives before the earlier changes it depends on is reported only after those changes arrive. The part that applied immediately stays in the document and is saved with the room. If the room closes first, that part never appears here.
- Waiting updates are discarded once they pass the document size limit. They can still end up in the document and will not be listed.
- If the listener throws, that batch is not sent again.
