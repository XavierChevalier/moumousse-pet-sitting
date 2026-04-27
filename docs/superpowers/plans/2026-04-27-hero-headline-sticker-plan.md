# Hero headline “sticker” style Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the homepage hero headline to match the “sticker” blocks style from the reference image (option A), without text outline.

**Architecture:** Keep existing hero structure; restyle only the `<h1>` spans into 3 black “sticker” blocks with per-line rotation and theme colors.

**Tech Stack:** Astro components, Tailwind CSS utilities, existing theme colors in `src/styles/global.css`.

---

### Task 1: Restyle hero headline to sticker blocks

**Files:**

- Modify: `src/components/home/HeroSection.astro`

- [ ] **Step 1: Update headline markup (3 sticker lines)**

Replace the current `<h1>` span structure with 3 “lines”:

```astro
<h1
  class="text-3xl leading-tight font-black tracking-wide text-balance uppercase sm:text-4xl md:text-5xl lg:text-7xl"
>
  <span class="hero-sticker-line text-tertiary">Faites garder</span>
  <span class="hero-sticker-line hero-sticker-line--alt text-secondary">vos animaux</span>
  <span class="hero-sticker-line hero-sticker-line--alt2">
    <span class="text-primary">en bonne</span>
    <span class="text-white">compagnie</span>
  </span>
</h1>
```

- [ ] **Step 2: Add component-local CSS for sticker lines**

Add a `<style>` block to `HeroSection.astro` to implement:

- black rectangular background
- inline-block sizing
- padding
- per-line rotation
- centered on small screens, left aligned on large screens

```css
.hero-sticker-line {
  /* base sticker styles */
}
.hero-sticker-line--alt {
  /* rotation variant */
}
.hero-sticker-line--alt2 {
  /* rotation variant */
}
```

- [ ] **Step 3: Run local check**

Run dev server and visually verify the hero headline matches the reference intent:

```bash
npm run dev
```

Expected: Headline shows 3 black “stickers”, no outline stroke, and colors match theme (purple/yellow/cyan+white).
