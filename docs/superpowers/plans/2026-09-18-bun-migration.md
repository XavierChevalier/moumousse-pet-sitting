# Bun Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the project from pnpm + Vitest to Bun as the sole package manager and test runner, with CI and docs updated accordingly.

**Architecture:** Keep Astro/Vite/ESLint as-is and invoke them via `bun run`. Replace Vitest with Bun’s native test runner (`bun:test`). Do not force Bun’s runtime onto Astro via `bun --bun` (protects native deps like `sharp`).

**Tech Stack:** Bun 1.3.x, Astro 5, Tailwind CSS 4, ESLint 9, GitHub Actions (`oven-sh/setup-bun@v2`).

**Spec:** `docs/superpowers/specs/2026-09-18-bun-migration-design.md`

## Global Constraints

- Bun is the only package manager; remove pnpm lockfile and packageManager references.
- Do not run Astro with `bun --bun`.
- Use `bun install --frozen-lockfile` in CI.
- Preserve existing lint/build behavior; only swap package manager + test runner.
- Do not commit `.pnpm-store/` or secrets.
- Netlify dashboard settings are out of scope (no Netlify config in repo).

## File Structure

| File                               | Responsibility                                               |
| ---------------------------------- | ------------------------------------------------------------ |
| `package.json`                     | Declare `packageManager: bun@…`, scripts, deps (drop vitest) |
| `bun.lock`                         | Reproducible Bun lockfile (committed)                        |
| `pnpm-lock.yaml`                   | Remove                                                       |
| `vitest.config.mjs`                | Remove                                                       |
| `src/**/*.test.ts` (3 files)       | Import from `bun:test`; keep assertions equivalent           |
| `.github/workflows/tests.yml`      | Install Bun, frozen install, `bun test`                      |
| `README.md`, `README_DEVELOPER.md` | Developer commands use Bun                                   |
| `.cursor/worktrees.json`           | Worktree setup runs `bun install`                            |

---

### Task 1: Switch package manager to Bun

**Files:**

- Modify: `package.json`
- Create: `bun.lock` (via install)
- Delete: `pnpm-lock.yaml`
- Note: discard accidental local `packageManager: pnpm@12.4.2` bump if still present; replace with Bun

**Interfaces:**

- Consumes: existing dependency list in `package.json`
- Produces: working `node_modules` + committed `bun.lock`; `packageManager` set to installed Bun version

- [ ] **Step 1: Set `packageManager` and keep scripts (test still points at vitest temporarily)**

In `package.json`, replace the `packageManager` field with the local Bun version from `bun --version` (example if `1.3.14`):

```json
"packageManager": "bun@1.3.14",
```

Leave `"test": "vitest"` for now (Task 2 switches it). Keep `engines.node` unchanged.

- [ ] **Step 2: Remove pnpm lockfile and install with Bun**

```bash
rm -f pnpm-lock.yaml
bun install
```

Expected: `bun.lock` created; install completes without error.

- [ ] **Step 3: Sanity-check Bun can run existing scripts**

```bash
bun run lint
```

Expected: ESLint exits 0 (or same baseline as before migration). If lint was already failing, note failures but do not expand scope beyond migration blockers.

- [ ] **Step 4: Commit**

```bash
git add package.json bun.lock
git rm -f pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
chore: switch package manager from pnpm to Bun

EOF
)"
```

---

### Task 2: Migrate unit tests from Vitest to `bun:test`

**Files:**

- Modify: `src/components/seo/NormalizeCanonicalURL.test.ts`
- Modify: `src/components/galleries/buildLightboxItems.test.ts`
- Modify: `src/scripts/gallery-embla-interactions.test.ts`
- Modify: `package.json` (`scripts.test`)

**Interfaces:**

- Consumes: existing test suites and production modules they import
- Produces: all tests runnable via `bun test` / `bun run test`

- [ ] **Step 1: Point the test script at Bun**

In `package.json`:

```json
"test": "bun test"
```

- [ ] **Step 2: Update SEO + lightbox builder tests to `bun:test`**

Replace Vitest imports in both files with:

```ts
import { describe, expect, it } from 'bun:test'
```

Full `NormalizeCanonicalURL.test.ts`:

```ts
import { describe, expect, it } from 'bun:test'
import { normalizeCanonicalURL } from './NormalizeCanonicalURL'

const baseURL = 'https://example.com'

describe('normalizeCanonicalURL', () => {
  it('returns base URL when pathname is undefined', () => {
    const result = normalizeCanonicalURL({ baseURL, pathname: undefined })

    expect(result).toBe(`${baseURL}/`)
  })

  it('returns base URL when pathname is empty', () => {
    const result = normalizeCanonicalURL({ baseURL, pathname: '' })

    expect(result).toBe(`${baseURL}/`)
  })

  it('normalizes pathname without leading slash', () => {
    const result = normalizeCanonicalURL({ baseURL, pathname: 'about' })

    expect(result).toBe(`${baseURL}/about`)
  })

  it('keeps pathname with leading slash as-is', () => {
    const result = normalizeCanonicalURL({ baseURL, pathname: '/contact' })

    expect(result).toBe(`${baseURL}/contact`)
  })

  it('removes query parameters and hash for canonical URL', () => {
    const result = normalizeCanonicalURL({
      baseURL,
      pathname: '/search?q=cat#section',
    })

    expect(result).toBe(`${baseURL}/search`)
  })
})
```

Full `buildLightboxItems.test.ts`:

```ts
import { describe, expect, it } from 'bun:test'
import { buildLightboxItems } from './buildLightboxItems'

describe('buildLightboxItems', () => {
  it('uses optimized thumbnail sources instead of raw asset sources', () => {
    const items = buildLightboxItems({
      images: [
        {
          img: { src: '/raw/bene.jpeg', width: 3024, height: 4032, format: 'jpeg' },
          title: 'Bene',
          subtitle: 'Portrait',
        },
      ],
      lightboxFullSrcs: ['/optimized/bene-lightbox.webp'],
      lightboxThumbSrcs: ['/optimized/bene-thumb.webp'],
      cardLqipSrcs: ['/optimized/bene-lqip.webp'],
    })

    expect(items).toEqual([
      {
        fullSrc: '/optimized/bene-lightbox.webp',
        posterSrc: '/optimized/bene-lqip.webp',
        thumbSrc: '/optimized/bene-thumb.webp',
        intrinsicWidth: 3024,
        intrinsicHeight: 4032,
        title: 'Bene',
        subtitle: 'Portrait',
      },
    ])
  })
})
```

- [ ] **Step 3: Update gallery interaction tests and replace `toBeTypeOf`**

In `src/scripts/gallery-embla-interactions.test.ts`:

1. Change import to `import { describe, expect, it } from 'bun:test'`
2. Replace every `expect(x).toBeTypeOf('function')` with `expect(typeof x).toBe('function')` (Bun/Jest do not provide Vitest’s `toBeTypeOf`).

Concrete replacements in that file:

```ts
expect(typeof lightboxModule.setupLightboxBlurImageLoadedState).toBe('function')
expect(typeof lightboxModule.portalLightboxHostToBody).toBe('function')
expect(typeof galleryInitModule.prepareGalleryLoopClone).toBe('function')
expect(typeof lightboxModule.resolveLightboxTrigger).toBe('function')
```

Keep all other assertions and helpers unchanged.

- [ ] **Step 4: Run tests**

```bash
bun test
```

Expected: all suites pass (currently 3 files; SEO + lightbox builder + gallery interactions).

If a matcher fails, fix only the matcher/import; do not change production code unless a real bug is revealed.

- [ ] **Step 5: Commit**

```bash
git add package.json \
  src/components/seo/NormalizeCanonicalURL.test.ts \
  src/components/galleries/buildLightboxItems.test.ts \
  src/scripts/gallery-embla-interactions.test.ts
git commit -m "$(cat <<'EOF'
test: migrate unit tests from Vitest to bun:test

EOF
)"
```

---

### Task 3: Remove Vitest tooling

**Files:**

- Delete: `vitest.config.mjs`
- Modify: `package.json` (remove `vitest` from `devDependencies`)
- Modify: `bun.lock` (via install)

**Interfaces:**

- Consumes: Task 2 tests already on `bun:test`
- Produces: no Vitest dependency or config left in the project

- [ ] **Step 1: Remove Vitest dependency and config**

```bash
rm -f vitest.config.mjs
bun remove -d vitest
```

Confirm `package.json` no longer lists `vitest` and `vitest.config.mjs` is gone.

- [ ] **Step 2: Re-run tests and lint**

```bash
bun test
bun run lint
```

Expected: both succeed.

- [ ] **Step 3: Commit**

```bash
git add package.json bun.lock
git rm -f vitest.config.mjs
git commit -m "$(cat <<'EOF'
chore: remove Vitest after Bun test migration

EOF
)"
```

---

### Task 4: Update GitHub Actions CI to Bun

**Files:**

- Modify: `.github/workflows/tests.yml`

**Interfaces:**

- Consumes: `bun.lock` + `bun test` from Tasks 1–3
- Produces: CI installs Bun and runs frozen install + tests

- [ ] **Step 1: Replace workflow contents**

Write `.github/workflows/tests.yml` as:

```yaml
name: Tests

on:
  push:
    branches:
      - master
      - main
  pull_request:
    branches:
      - master
      - main

jobs:
  test:
    name: Run unit tests
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: 1.3.14

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Run tests
        run: bun test
```

Use the same Bun version as `package.json` `packageManager` / local `bun --version`. If local Bun differs from `1.3.14`, substitute that exact version in both places.

- [ ] **Step 2: Local dry-run of CI commands**

```bash
bun install --frozen-lockfile
bun test
```

Expected: install does not mutate lockfile; tests pass.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/tests.yml
git commit -m "$(cat <<'EOF'
ci: run tests with Bun instead of pnpm

EOF
)"
```

---

### Task 5: Update docs and Cursor worktree setup

**Files:**

- Modify: `README.md`
- Modify: `README_DEVELOPER.md`
- Modify: `.cursor/worktrees.json`

**Interfaces:**

- Consumes: Bun commands established in Tasks 1–4
- Produces: docs/tooling that no longer mention pnpm for day-to-day workflow

- [ ] **Step 1: Update README quick start**

In `README.md`, replace the Quick start block with:

```bash
bun install
bun run dev     # http://localhost:4321
bun run build   # Production build
```

Optionally add Bun to the stack bullets near Astro/Tailwind.

- [ ] **Step 2: Update developer guide**

In `README_DEVELOPER.md`:

- Prerequisites: replace `pnpm` with `Bun` (keep Node mention if Astro still benefits from documenting Node compatibility).
- Replace all install/dev/build/preview/script examples that use `pnpm` with `bun` / `bun run` equivalents:

```bash
bun install
bun run dev
bun run build
bun run preview
bun run lint
bun test
```

Update the “Scripts manquants recommandés” bullets similarly (`bun run lint`, etc.).

- [ ] **Step 3: Update Cursor worktrees**

`.cursor/worktrees.json`:

```json
{
  "setup-worktree": ["bun install"]
}
```

- [ ] **Step 4: Grep for leftover pnpm workflow refs**

```bash
rg -n '\\bpnpm\\b' README.md README_DEVELOPER.md .cursor/worktrees.json .github/workflows package.json || true
```

Expected: no hits in those workflow surfaces (historical mentions inside old design docs under `docs/superpowers/` may remain).

- [ ] **Step 5: Commit**

```bash
git add README.md README_DEVELOPER.md .cursor/worktrees.json
git commit -m "$(cat <<'EOF'
docs: document Bun as the project package manager

EOF
)"
```

---

### Task 6: Full verification (install, test, lint, build)

**Files:**

- None required unless verification finds a migration bug

**Interfaces:**

- Consumes: complete Bun toolchain from Tasks 1–5
- Produces: evidence that install/test/lint/build all succeed

- [ ] **Step 1: Clean install check**

```bash
rm -rf node_modules
bun install --frozen-lockfile
```

Expected: success; lockfile unchanged (`git status` clean for `bun.lock`).

- [ ] **Step 2: Run test + lint + build**

```bash
bun test
bun run lint
bun run build
```

Expected:

- tests: all green
- lint: exit 0
- build: Astro production build completes; `dist/` generated (Sharp image pipeline OK without `bun --bun`)

- [ ] **Step 3: Optional preview smoke**

```bash
bun run preview
```

Expected: preview server starts; stop it after confirming it boots.

- [ ] **Step 4: Commit only if verification forced fixes**

If fixes were needed, commit them with a focused message. If nothing changed, skip empty commit.

---

## Spec coverage checklist

| Spec requirement                                | Task               |
| ----------------------------------------------- | ------------------ |
| Bun as sole package manager + `bun.lock`        | Task 1             |
| Remove `pnpm-lock.yaml`                         | Task 1             |
| Scripts via `bun run` / `bun test`              | Tasks 1–2, 5       |
| Migrate 3 Vitest files to `bun:test`            | Task 2             |
| Remove Vitest + `vitest.config.mjs`             | Task 3             |
| CI with setup-bun + frozen lockfile             | Task 4             |
| Docs + worktrees                                | Task 5             |
| Verify install/test/lint/build                  | Task 6             |
| No `bun --bun` / Netlify dashboard out of scope | Global Constraints |
