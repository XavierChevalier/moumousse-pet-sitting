# Design: Migration complète vers Bun

Date: 2026-09-18  
Status: Design approved in conversation; awaiting written review before implementation plan

## Goal

Migrer le projet Moumousse Pet Sitting de pnpm vers Bun de bout en bout : package manager, scripts locaux, tests unitaires, CI GitHub Actions, et documentation développeur.

Critère de succès : `bun install`, `bun test`, `bun run lint`, et `bun run build` réussissent en local ; la CI GitHub Actions exécute les tests avec Bun.

## Context

- Stack actuelle : Astro 5, Tailwind CSS 4, Vitest, ESLint, Prettier.
- Package manager actuel : pnpm (`pnpm-lock.yaml`, `packageManager: pnpm@…`).
- Bun est déjà disponible en local (v1.3.x).
- 3 fichiers de tests Vitest, API `describe` / `it` / `expect`.
- CI : `.github/workflows/tests.yml` installe pnpm + Node 22.
- Déploiement Netlify (badge README) ; aucune config Netlify versionnée dans le repo.
- Refs pnpm aussi dans `README.md`, `README_DEVELOPER.md`, `.cursor/worktrees.json`.

## Decision

Approche retenue : **Bun partout (pragmatique)**.

- Bun comme seul package manager.
- Scripts via `bun run` / `bunx`.
- Remplacer Vitest par le runner natif `bun test`.
- Ne pas forcer le runtime Bun sur le CLI Astro (`bun --bun`) afin d’éviter les risques avec les binaires natifs (`sharp`).
- Astro / Vite restent lancés via leurs CLIs sous `bun run`.

Approches écartées :

- Hybride (garder Vitest) : trop partiel pour l’objectif « TOUT ».
- Runtime agressif (`bun --bun` sur Astro) : fragile avec `sharp` et peu de gain pour un site SSG.

## Scope

### In scope

1. **Package manager**
   - Remplacer `packageManager` par `bun@<version installée>`.
   - Générer `bun.lock` via `bun install`.
   - Supprimer `pnpm-lock.yaml`.
   - Ne pas versionner `.pnpm-store/` (déjà hors git ; s’assurer qu’il reste ignoré / non commité).

2. **Scripts**
   - Mettre à jour `package.json` : `"test": "bun test"` (ou équivalent stable).
   - Documenter `bun install`, `bun run dev|build|preview|lint`, `bun test`.
   - Conserver les scripts Astro/ESLint existants ; ils s’exécutent via Bun.

3. **Tests**
   - Migrer les 3 fichiers `*.test.ts` de `vitest` vers `bun:test`.
   - Adapter les assertions si besoin (`toBeTypeOf`, etc.) pour rester équivalentes.
   - Supprimer `vitest` des `devDependencies` et supprimer `vitest.config.mjs`.
   - Préserver le comportement concurrent / shuffle seulement s’il existe un équivalent simple Bun ; sinon accepter l’ordre séquentiel/déterministe de Bun (non bloquant).

4. **CI**
   - Remplacer setup pnpm + cache Node pnpm par `oven-sh/setup-bun`.
   - `bun install --frozen-lockfile` (ou flag Bun équivalent pour lockfigé).
   - `bun test`.

5. **Docs & tooling Cursor**
   - Mettre à jour `README.md`, `README_DEVELOPER.md`.
   - Mettre à jour `.cursor/worktrees.json` (`bun install`).

### Out of scope

- Forcer le runtime Bun pour Astro (`--bun`).
- Modifier les settings Netlify dans le dashboard (pas de fichier Netlify dans le repo).
- Remplacer ESLint / Prettier / Astro par des outils Bun-native.
- Migrer le store local `.pnpm-store` (simple nettoyage local optionnel, hors commit).

## File / surface changes (expected)

| Surface | Action |
| --- | --- |
| `package.json` | `packageManager` → bun ; script `test` ; retirer vitest |
| `bun.lock` | Ajouter |
| `pnpm-lock.yaml` | Supprimer |
| `vitest.config.mjs` | Supprimer |
| `src/**/*.test.ts` (3 fichiers) | Imports `bun:test` |
| `.github/workflows/tests.yml` | setup-bun + bun install/test |
| `README.md`, `README_DEVELOPER.md` | Commandes bun |
| `.cursor/worktrees.json` | `bun install` |

## Verification plan

1. `bun install` propre (après retrait du lock pnpm).
2. `bun test` — les 3 suites passent.
3. `bun run lint` — pas de régression.
4. `bun run build` — build Astro OK (images Sharp inclus).
5. Contrôle visuel rapide optionnel via `bun run preview` si le build passe.
6. Workflow CI aligné sur les mêmes commandes.

## Risks & mitigations

| Risk | Mitigation |
| --- | --- |
| Différences d’API `bun:test` vs Vitest | Migrer fichier par fichier ; ajuster les matchers ; garder les assertions métier. |
| `sharp` / natifs sous Bun | Lancer Astro via `bun run` sans `--bun`. |
| Flag freeze-lockfile Bun | Vérifier la doc Bun de la version installée et utiliser le flag correct en CI. |
| Netlify build encore en pnpm | Hors repo ; noter en follow-up si le build Netlify échoue après merge. |

## Non-goals reminder

Pas de refonte de stack, pas de changement de design site, pas de nouvelles features produit.
