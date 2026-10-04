---
name: Scoped workspace dependencies
description: Installing dependencies into the correct pnpm workspace package.
---

When a dependency belongs to one artifact in this pnpm monorepo, install it in that workspace rather than adding it at the root. The generic package-install helper may invoke a root-level `pnpm add`, which pnpm rejects with `ERR_PNPM_ADDING_TO_ROOT`.

**Why:** The Expo app needs dependencies declared in its own package so installs and builds stay reproducible; a root-only dependency is not an equivalent substitute.

**How to apply:** If the package helper cannot target a workspace, use the package-scoped pnpm command, such as `pnpm --filter @workspace/uci-education add <package>`.