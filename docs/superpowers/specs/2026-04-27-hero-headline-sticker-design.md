---
title: Hero headline “sticker” style
date: 2026-04-27
component: src/components/home/HeroSection.astro
status: draft
---

## Goal

Match the hero headline style from the provided reference image:
“Faites garder vos animaux en bonne compagnie”.

## In scope

- Update headline visual styling only (the `<h1>` content in `HeroSection.astro`)
- Keep current wording
- Remove the current outline effect (`.text-outline`) for this headline

## Target visual

- **Layout**: 3 “sticker” lines (each line is an inline-block block)
  - Line 1: “FAITES GARDER”
  - Line 2: “VOS ANIMAUX”
  - Line 3: “EN BONNE COMPAGNIE” (same black block; “EN BONNE” cyan, “COMPAGNIE” white)
- **Background**: solid black rectangle behind each line
- **Typography**: uppercase, heavy weight (keep existing `font-black`), tight leading
- **Rotation**: slight per-line rotation, similar to reference
  - Line 1: ~ -2deg
  - Line 2: ~ +1deg
  - Line 3: ~ -1deg
- **Colors** (reuse existing theme colors):
  - Line 1 text: `text-tertiary`
  - Line 2 text: `text-secondary`
  - Line 3 text: `text-primary` for “EN BONNE”, `text-white` for “COMPAGNIE”

## Implementation approach

- Add a small, component-local “sticker” class (e.g. `.hero-sticker`) in `HeroSection.astro` (preferred) or in `src/styles/global.css` if we want to reuse later.
- Apply `bg-black` + padding + inline-block to each line span.
- Remove `text-outline` from the headline spans.

## Success criteria

- Headline reads clearly and visually matches the reference: black sticker blocks, colored text, small rotations, no outline stroke.
