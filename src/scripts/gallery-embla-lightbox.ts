/**
 * Fullscreen lightbox: carousel, drag, and navigation via Embla.
 * Parallax on the inner layer (official tween pattern).
 * @see https://www.embla-carousel.com/docs/examples/predefined#parallax
 */
import EmblaCarousel, { type EmblaCarouselType, type EmblaEventModelType } from 'embla-carousel'

const FOCUSABLE =
  'button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

/** Matches the official Parallax (Tween) example. */
const TWEEN_FACTOR_BASE = 0.2

/** Neighbor slides to prefetch (HTTP cache) around the active slide for smoother swiping. */
const LIGHTBOX_PREFETCH_RADIUS = 3

function loopSlideIndex(i: number, n: number): number {
  return ((i % n) + n) % n
}

/** Circular distance between slide indices (loop mode). */
function circularSlideDistance(a: number, b: number, n: number): number {
  if (n <= 0) return 0
  const d = Math.abs(a - b)
  return Math.min(d, n - d)
}

/** Active slide = high priority; ±1 = auto; within prefetch radius = low; beyond = browser default. */
function setImageLoadingPriorityByDistance(img: HTMLImageElement, dist: number): void {
  img.loading = dist <= LIGHTBOX_PREFETCH_RADIUS ? 'eager' : 'lazy'
  if (dist === 0) img.fetchPriority = 'high'
  else if (dist === 1) img.fetchPriority = 'auto'
  else if (dist <= LIGHTBOX_PREFETCH_RADIUS) img.fetchPriority = 'low'
  else img.removeAttribute('fetchpriority')
}

/** Full-size images: `loading` / `fetchPriority` from distance to the active slide. */
function setLightboxLoadingHints(host: HTMLElement, centerIndex: number, loop: boolean): void {
  const slides = [...host.querySelectorAll<HTMLElement>('.gallery-lightbox-embla__slide')]
  const n = slides.length
  slides.forEach((slide, idx) => {
    const img = slide.querySelector<HTMLImageElement>('.gallery-lightbox__parallax__img')
    if (!img) return
    const dist = loop ? circularSlideDistance(idx, centerIndex, n) : Math.abs(idx - centerIndex)
    setImageLoadingPriorityByDistance(img, dist)
  })
}

/** Thumbnails: same logic as slides (scrollable strip). */
function setLightboxThumbLoadingHints(
  thumbs: HTMLElement,
  centerIndex: number,
  loop: boolean,
  slideCount: number
): void {
  const n = slideCount
  thumbs.querySelectorAll<HTMLImageElement>('img[data-thumb-index]').forEach((img) => {
    const idx = Number(img.dataset.thumbIndex)
    if (!Number.isFinite(idx)) return
    const dist = loop ? circularSlideDistance(idx, centerIndex, n) : Math.abs(idx - centerIndex)
    setImageLoadingPriorityByDistance(img, dist)
  })
}

/** Prefetch URLs of incomplete images around the active slide (HTTP cache, smoother swipe). */
function warmLightboxNeighbors(host: HTMLElement, centerIndex: number, loop: boolean): void {
  const slides = [...host.querySelectorAll<HTMLElement>('.gallery-lightbox-embla__slide')]
  const n = slides.length
  if (n === 0) return

  for (let d = -LIGHTBOX_PREFETCH_RADIUS; d <= LIGHTBOX_PREFETCH_RADIUS; d++) {
    const idx = loop ? loopSlideIndex(centerIndex + d, n) : centerIndex + d
    if (!loop && (idx < 0 || idx >= n)) continue
    const slide = slides[idx]
    const img = slide?.querySelector<HTMLImageElement>('.gallery-lightbox__parallax__img')
    if (!img || img.complete) continue
    const url = img.currentSrc || img.src
    if (!url) continue
    const pre = new Image()
    pre.src = url
  }
}

/** Max slide width cap (~72rem), aligned with multi-slide peek. */
function maxLightboxSlideWidthPx(): number {
  return Math.min(window.innerWidth * 0.92, 1152)
}

export function resolveLightboxTrigger(target: EventTarget | null): HTMLElement | null {
  if (!target || typeof target !== 'object' || !('closest' in target)) return null

  const closest = target.closest
  if (typeof closest !== 'function') return null

  return closest.call(target, '.gallery-lightbox-item[data-index]') as HTMLElement | null
}

export function portalLightboxHostToBody(
  host: HTMLElement,
  body: HTMLElement = document.body
): void {
  if (host.parentElement === body) return
  body.appendChild(host)
}

export function setupLightboxBlurImageLoadedState(host: HTMLElement): void {
  const markLoaded = (img: HTMLImageElement) => {
    img.dataset.loaded = 'true'
  }

  host.addEventListener(
    'load',
    (e) => {
      const t = e.target
      if (t instanceof HTMLImageElement && t.classList.contains('gallery-blur-img')) markLoaded(t)
    },
    true
  )

  host.querySelectorAll<HTMLImageElement>('.gallery-blur-img').forEach((img) => {
    if (img.complete && img.naturalWidth > 0) markLoaded(img)
  })
}

/**
 * Slide width = frame height × intrinsic ratio (from build), never naturalWidth after decode.
 * Otherwise the slide grows on load → Embla ResizeObserver → reInit → breaks dragFree / momentum.
 */
function measureLightboxSlideWidthPx(slide: HTMLElement): number {
  const maxW = maxLightboxSlideWidthPx()
  const parallax = slide.querySelector<HTMLElement>('.gallery-lightbox__parallax')
  const img = slide.querySelector<HTMLImageElement>('.gallery-lightbox__parallax__img')
  if (!parallax || !img) return Math.min(maxW, 400)

  const H = parallax.getBoundingClientRect().height
  let iw = Number(slide.dataset.slideIw)
  let ih = Number(slide.dataset.slideIh)
  if (!Number.isFinite(iw) || !Number.isFinite(ih) || iw <= 0 || ih <= 0) {
    iw = Number(img.getAttribute('width')) || 3
    ih = Number(img.getAttribute('height')) || 4
  }
  if (H <= 0) return Math.min(maxW, 400)
  return Math.max(1, Math.round(Math.min(maxW, (H * iw) / ih)))
}

function applyLightboxSlideWidths(api: EmblaCarouselType, host: HTMLElement): void {
  const slides = api.slideNodes()
  if (slides.length === 0) return

  const widths = slides.map((s) => measureLightboxSlideWidthPx(s))
  const signature = widths.join(',')
  if (host.dataset.lightboxSlideWidths === signature) return
  host.dataset.lightboxSlideWidths = signature

  const i = api.selectedSnap()
  slides.forEach((slide, idx) => {
    const w = `${widths[idx]}px`
    slide.style.flexBasis = w
    slide.style.flexGrow = '0'
    slide.style.flexShrink = '0'
    slide.style.width = w
    slide.style.minWidth = w
    slide.style.maxWidth = w
  })
  api.reInit()
  api.goTo(i, true)
}

/** Parallax tween (vanilla Embla, v9 engine). Single pass per frame (rAF coalescing). */
function setupTweenParallax(api: EmblaCarouselType): void {
  let factor = 0
  let layers: (HTMLElement | null)[] = []
  let tweenRaf = 0
  let pendingEventType: string | undefined

  const refreshLayers = () => {
    layers = api
      .slideNodes()
      .map((s) => s.querySelector<HTMLElement>('[data-lightbox-parallax-layer]'))
    factor = TWEEN_FACTOR_BASE * api.snapList().length
  }

  const tween = (eventType?: string) => {
    const eng = api.internalEngine()
    const progress = api.scrollProgress()
    const inView = api.slidesInView()
    const bySnap = eng.scrollSnapList.slidesBySnap
    const isScroll = eventType === 'scroll'
    // slidesInView() is driven by IntersectionObserver: while it is empty, do not skip
    // off-screen slides or there is no tween during swipe (includes is always false).
    const skipOffscreen = isScroll && inView.length > 0

    api.snapList().forEach((snap, si) => {
      let d = snap - progress
      const group = bySnap[si]
      if (!group) return

      for (const slideIndex of group) {
        if (skipOffscreen && !inView.includes(slideIndex)) continue
        if (eng.options.loop) {
          for (const lp of eng.slideLooper.loopPoints) {
            const t = lp.target()
            if (slideIndex === lp.index && t !== 0) {
              const s = Math.sign(t)
              if (s === -1) d = snap - (1 + progress)
              if (s === 1) d = snap + (1 - progress)
            }
          }
        }
        const node = layers[slideIndex]
        if (node) node.style.transform = `translateX(${d * -factor * 100}%)`
      }
    })
  }

  const flushTween = () => {
    tweenRaf = 0
    const t = pendingEventType
    pendingEventType = undefined
    tween(t)
  }

  const scheduleTween = (eventType?: string) => {
    pendingEventType = eventType
    if (tweenRaf) return
    tweenRaf = requestAnimationFrame(flushTween)
  }

  const onScrollOrFocus = (
    _: EmblaCarouselType,
    e: EmblaEventModelType<'scroll' | 'slidefocus'>
  ) => {
    scheduleTween(e.type)
  }

  refreshLayers()
  tween()

  api
    .on('reinit', refreshLayers)
    .on('reinit', () => {
      if (tweenRaf) cancelAnimationFrame(tweenRaf)
      tweenRaf = 0
      pendingEventType = undefined
      tween()
    })
    .on('scroll', onScrollOrFocus)
    .on('slidefocus', onScrollOrFocus)
}

/** Enable fade-in reveal on lightbox images: preview (background) shows instantly, high-res fades in. */
function setupLightboxReveal(host: HTMLElement): void {
  host.classList.add('lightbox-reveal-active')
  host.querySelectorAll<HTMLImageElement>('.gallery-lightbox-reveal').forEach((img) => {
    const reveal = () => img.classList.add('lb-loaded')
    if (img.complete && img.naturalWidth > 0) reveal()
    else img.addEventListener('load', reveal, { once: true })
  })
}

/** Reset reveal state so next open starts fresh (images may have been swapped/reloaded). */
function resetLightboxReveal(host: HTMLElement): void {
  host.classList.remove('lightbox-reveal-active')
  host.querySelectorAll<HTMLImageElement>('.gallery-lightbox-reveal').forEach((img) => {
    img.classList.remove('lb-loaded')
  })
}

export function initGalleryEmblaLightbox(galleryRoot: HTMLElement): void {
  const host = galleryRoot.querySelector<HTMLElement>('[data-gallery-lightbox]')
  const viewport = host?.querySelector<HTMLElement>('[data-lightbox-viewport]')
  const slideCount =
    host?.querySelectorAll<HTMLElement>('.gallery-lightbox-embla__slide').length ?? 0
  const hasMultipleSlides = slideCount > 1
  if (!host || !viewport || slideCount === 0) return

  // The gallery section uses containment for performance; keep the fixed overlay outside it.
  portalLightboxHostToBody(host)
  setupLightboxBlurImageLoadedState(host)

  const thumbs = host.querySelector<HTMLElement>('[data-lightbox-thumbs]')
  let api: EmblaCarouselType | null = null
  let savedFocus: HTMLElement | null = null
  /** Last “active” thumbnail: avoids scanning every thumb on each `select`. */
  let lastActiveThumbIndex = -1

  const $ = <T extends HTMLElement>(sel: string) => host.querySelector<T>(sel)

  const lockBody = (on: boolean) => {
    const v = on ? 'hidden' : ''
    document.documentElement.style.overflow = v
    document.body.style.overflow = v
  }

  let layoutDebounceTimer: number | null = null
  let layoutAbort: AbortController | null = null
  /** Embla fires `scroll` while scroll / dragFree is still moving (including inertia). */
  let emblaScrollInMotion = false
  /** Resize (etc.): wait for `settle` before `reInit` so momentum is not cut off. */
  let layoutQueuedUntilSettle = false

  /** @returns true if a `reInit` / full layout run happened (already includes heavy sync). */
  const tryFlushLayoutWhenSettled = (): boolean => {
    if (!layoutQueuedUntilSettle || !api || host.classList.contains('hidden')) return false
    if (emblaScrollInMotion) return false
    layoutQueuedUntilSettle = false
    delete host.dataset.lightboxSlideWidths
    runSlideLayout()
    return true
  }

  const queueSlideLayout = () => {
    layoutQueuedUntilSettle = true
    tryFlushLayoutWhenSettled()
  }

  /** Title + thumbnail highlight: lightweight, on every `select` (fast arrows, swipe). */
  const syncLightboxUi = () => {
    if (!api) return
    const i = api.selectedSnap()
    const slide = api.slideNodes()[i]

    const titleEl = $('[data-lightbox-title-text]')
    const subEl = $('[data-lightbox-subtitle-text]')
    if (titleEl) titleEl.textContent = slide?.dataset.title ?? ''
    if (subEl) {
      const st = slide?.dataset.subtitle ?? ''
      subEl.textContent = st
      subEl.style.display = st ? 'block' : 'none'
    }

    if (!thumbs || i === lastActiveThumbIndex) return

    const setThumbActive = (idx: number, active: boolean) => {
      const img = thumbs.querySelector<HTMLImageElement>(`img[data-thumb-index="${idx}"]`)
      if (!img) return
      img.classList.toggle('ring-primary', active)
      img.classList.toggle('opacity-100', active)
      img.classList.toggle('opacity-70', !active)
    }
    if (lastActiveThumbIndex >= 0) setThumbActive(lastActiveThumbIndex, false)
    setThumbActive(i, true)
    lastActiveThumbIndex = i
  }

  /**
   * Loading hints, neighbor prefetch, thumbnail-strip scroll: expensive —
   * only when settled (`settle`) or after layout recalc, not on every `select`.
   */
  const syncLightboxHeavy = () => {
    if (!api) return
    const i = api.selectedSnap()
    const loop = hasMultipleSlides
    const slideCount = api.slideNodes().length
    setLightboxLoadingHints(host, i, loop)
    if (thumbs) setLightboxThumbLoadingHints(thumbs, i, loop, slideCount)
    warmLightboxNeighbors(host, i, loop)
    thumbs
      ?.querySelector(`img[data-thumb-index="${i}"]`)
      ?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'auto' })
  }

  const runSlideLayout = () => {
    if (!api || host.classList.contains('hidden')) return
    applyLightboxSlideWidths(api, host)
    syncLightboxUi()
    syncLightboxHeavy()
  }

  const scheduleSlideLayout = (opts?: { debounceMs?: number }) => {
    const ms = opts?.debounceMs ?? 0
    if (ms > 0) {
      if (layoutDebounceTimer) clearTimeout(layoutDebounceTimer)
      layoutDebounceTimer = window.setTimeout(() => {
        layoutDebounceTimer = null
        queueSlideLayout()
      }, ms)
      return
    }
    queueSlideLayout()
  }

  const ensureApi = (): EmblaCarouselType => {
    if (api) {
      api.reInit()
      return api
    }
    api = EmblaCarousel(viewport, {
      loop: hasMultipleSlides,
      align: 'center',
      dragFree: true,
    })
    setupTweenParallax(api)
    api.on('scroll', () => {
      emblaScrollInMotion = true
    })
    api.on('settle', () => {
      emblaScrollInMotion = false
      const flushedLayout = tryFlushLayoutWhenSettled()
      if (!flushedLayout) syncLightboxHeavy()
    })
    api.on('select', syncLightboxUi)
    return api
  }

  const open = (index: number, from?: HTMLElement) => {
    savedFocus = from ?? (document.activeElement as HTMLElement)
    layoutAbort?.abort()
    layoutAbort = new AbortController()
    const { signal } = layoutAbort

    emblaScrollInMotion = false
    layoutQueuedUntilSettle = false
    lastActiveThumbIndex = -1

    host.classList.remove('hidden')
    lockBody(true)
    resetLightboxReveal(host)

    window.addEventListener(
      'resize',
      () => {
        scheduleSlideLayout({ debounceMs: 120 })
      },
      { signal }
    )

    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        host.dataset.state = 'open'
        const firstMount = api === null
        const instance = ensureApi()
        instance.goTo(index, true)
        const loopOpen = hasMultipleSlides
        setLightboxLoadingHints(host, index, loopOpen)
        if (thumbs)
          setLightboxThumbLoadingHints(thumbs, index, loopOpen, instance.slideNodes().length)
        warmLightboxNeighbors(host, index, loopOpen)
        setupLightboxReveal(host)
        scheduleSlideLayout()
        // First mount: viewport was coming from `display:none` — Embla often measures 0×0.
        // Later opens already go through `reInit()` in ensureApi().
        if (firstMount) {
          requestAnimationFrame(() => {
            scheduleSlideLayout()
          })
        }
        $('[data-lightbox-close]')?.focus()
      })
    )
  }

  const close = () => {
    layoutAbort?.abort()
    layoutAbort = null
    if (layoutDebounceTimer) {
      clearTimeout(layoutDebounceTimer)
      layoutDebounceTimer = null
    }
    emblaScrollInMotion = false
    layoutQueuedUntilSettle = false
    lastActiveThumbIndex = -1
    delete host.dataset.lightboxSlideWidths
    delete host.dataset.state
    lockBody(false)
    window.setTimeout(() => {
      host.classList.add('hidden')
      savedFocus?.focus()
      savedFocus = null
    }, 300)
  }

  galleryRoot.addEventListener('click', (e) => {
    const trigger = resolveLightboxTrigger(e.target)
    if (!trigger || !galleryRoot.contains(trigger)) return

    e.preventDefault()
    const i = Number(trigger.dataset.index)
    if (!Number.isNaN(i)) open(i, trigger)
  })

  host.addEventListener('click', (e) => {
    const t = e.target as HTMLElement
    if (t.closest('[data-lightbox-backdrop], [data-lightbox-close]')) {
      close()
      return
    }
    if (t.closest('[data-lightbox-prev]')) {
      api?.goToPrev()
      return
    }
    if (t.closest('[data-lightbox-next]')) {
      api?.goToNext()
      return
    }
    const thumb = t.closest<HTMLElement>('img[data-thumb-index]')
    if (thumb && api) {
      const i = Number(thumb.dataset.thumbIndex)
      if (!Number.isNaN(i)) api.goTo(i)
    }
  })

  host.addEventListener('keydown', (e) => {
    if (host.classList.contains('hidden') || e.key !== 'Tab') return
    const list = [...host.querySelectorAll<HTMLElement>(FOCUSABLE)]
    if (list.length === 0) return
    const first = list[0]!
    const last = list[list.length - 1]!
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  })

  document.addEventListener('keydown', (e) => {
    if (host.classList.contains('hidden')) return
    if (e.key === 'Escape') close()
    if (e.key === 'ArrowRight') api?.goToNext()
    if (e.key === 'ArrowLeft') api?.goToPrev()
  })
}
