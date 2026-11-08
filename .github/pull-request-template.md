Closes #<issue>

## 🎯 Changes

What changes are made in this PR? Is it a feature or a bug fix?

## ✅ Checklist

- [ ] I have followed every step in the [contributing guide](https://github.com/pluv-io/pluv/blob/main/CONTRIBUTING.md) (updated 2023-01-05).
- [ ] The PR title follows the [conventional-commit](https://www.conventionalcommits.org/en/v1.0.0/) convention.
- [ ] I have added or updated the tests related to the changes made.

## Server stack (only if this PR touches `packages/io`, platform packages, or `packages/cli/src/room`)

- [ ] I read or updated [`packages/io/ARCHITECTURE.md`](packages/io/ARCHITECTURE.md) when behavior or topology changed.
- [ ] Hosted work: `RoomFacet` and `supervisor.ts` were considered together, not only one side.
- [ ] Storage on the wire: pending `$storageUpdated` still makes sense; `writeFrames` vs `applyFrames` on hosted delivery is still correct.
- [ ] User-facing story: [`apps/docs/content/docs/architecture/`](apps/docs/content/docs/architecture/) updated when the room story changed.

---

## Changelog

_[Short description of what has changed]_
