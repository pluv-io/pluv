---
name: validate
description: >-
  Run pluv repository validations for format (oxfmt), lint (type-aware oxlint),
  and typecheck (turbo tsc). Use when the user asks to validate, run
  validations, run checks, check formatting, lint, or typecheck, or to verify
  a change before finishing.
---

# Validate

Run format, lint, and typecheck from the repository root with pnpm. These three checks are the validation. Do not add tests or a full build unless the user asks.

## Checks

Run all three, in this order, even if an earlier one fails. Continue so the report covers every check.

```bash
pnpm exec oxfmt --check .
pnpm exec oxlint --type-aware
pnpm typecheck
```

- **Format** is `oxfmt --check`. `pnpm format` writes files; do not use it for a check.
- **Lint** is type-aware oxlint only. `pnpm lint` also runs the format check, so do not run it alongside the format command above.
- **Typecheck** is `pnpm typecheck` (`turbo run typecheck`). Turbo builds upstream packages first (`dependsOn: ["^build"]`).

If type-aware lint fails because package declarations are missing, run `pnpm build:packages` once and rerun lint. Do not build before every validation.

## Fixes

Change files only when the user asks to fix validation failures. Apply the matching fix, then rerun the three checks:

| Failure | Fix |
|---|---|
| Format | `pnpm format` |
| Lint | `pnpm exec oxlint --fix --type-aware` |
| Typecheck | Edit the code. There is no autofix. |

`pnpm lint:fix` does both lint fix and format. Use it only when both format and lint failed.

## Report

Lead with one line per check, then the relevant failure output:

```markdown
- Format: pass
- Lint: fail
- Typecheck: pass
```

Quote the command output that shows the failure. Do not claim a check passed when its command exited non-zero.
