/**
 * Gallery: lazy-loaded Embla (dynamic `import()`).
 * With `prefers-reduced-motion: reduce`, rows use native horizontal scroll only (no Embla).
 */

const IO_ROOT_MARGIN = '200px 0px'
const MIN_SLIDES_FOR_LOOP = 2
/** Embla disables `loop` when `canLoop()` fails (not enough slide width vs viewport). Duplicate slides until content is wide enough. */
const LOOP_MIN_SCROLL_WIDTH_RATIO = 2.5
const MAX_LOOP_DUPLICATE_PASSES = 8

const EMBLA_OPTIONS = {
  loop: true,
  align: 'start' as const,
  dragFree: true,
}

/** v9 auto-scroll: defaultInteraction stops on pointerdown; resume explicitly on `settle` (see runGalleryInit). */
const AUTO_SCROLL_BASE = {
  speed: 0.5,
  startDelay: 0,
}

const inflight = new WeakMap<HTMLElement, Promise<void>>()

export async function initGalleryEmblaRoot(root: HTMLElement): Promise<void> {
  if (root.dataset.emblaReady === 'true') return

  const running = inflight.get(root)
  if (running) {
    await running
    return
  }

  const work = runGalleryInit(root)
  inflight.set(root, work)
  try {
    await work
  } finally {
    inflight.delete(root)
  }
}

export function scheduleGalleryEmblaInit(root: HTMLElement): void {
  if (root.dataset.emblaScheduled === 'true') return
  root.dataset.emblaScheduled = 'true'

  const start = () => {
    void initGalleryEmblaRoot(root)
  }

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        io.disconnect()
        start()
      },
      { rootMargin: IO_ROOT_MARGIN, threshold: 0 }
    )
    io.observe(root)
  }

  const runWhenIdle = (cb: () => void) => {
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(cb)
    } else {
      window.setTimeout(cb, 1)
    }
  }
  runWhenIdle(() => {
    if (root.dataset.emblaReady === 'true') return
    if (isVerticallyOnScreen(root)) start()
  })
}

async function runGalleryInit(root: HTMLElement): Promise<void> {
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      useNativeHorizontalScroll(root)
      return
    }

    const [{ default: EmblaCarousel }, { default: AutoScroll }] = await Promise.all([
      import('embla-carousel'),
      import('embla-carousel-auto-scroll'),
    ])

    const rows = [...root.querySelectorAll<HTMLElement>('[data-gallery-row]')]
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex]!
      const viewport = row.querySelector<HTMLElement>('[data-gallery-viewport]')
      if (!viewport) continue

      if (row.querySelectorAll('.gallery-lightbox-item').length < MIN_SLIDES_FOR_LOOP) {
        continue
      }

      duplicateSlidesUntilLoopable(viewport)

      viewport.classList.remove('overflow-x-auto', 'touch-pan-x')
      viewport.classList.add('overflow-hidden')

      const direction = rowIndex % 2 === 0 ? 'forward' : 'backward'
      const emblaApi = EmblaCarousel(viewport, EMBLA_OPTIONS, [
        AutoScroll({
          ...AUTO_SCROLL_BASE,
          direction,
        }),
      ])
      const autoScroll = emblaApi.plugins().autoScroll
      if (autoScroll) {
        // Plugin stops on pointerdown but does not restart on pointerup; after dragFree inertia, `settle` fires.
        emblaApi.on('settle', () => {
          void autoScroll.play()
        })
        autoScroll.play()
      }
    }
  } finally {
    root.dataset.emblaReady = 'true'
  }
}

export function prepareGalleryLoopClone(clone: HTMLElement): void {
  clone.classList.add('gallery-embla-clone')
  clone.setAttribute('aria-hidden', 'true')
}

/**
 * Append aria-hidden clones of `.gallery-lightbox-item` nodes so total track width satisfies Embla's `canLoop()`.
 */
function duplicateSlidesUntilLoopable(viewport: HTMLElement): void {
  const container = viewport.querySelector<HTMLElement>('.gallery-embla__container')
  const row = viewport.closest<HTMLElement>('[data-gallery-row]')
  if (!container || !row) return

  const originals = row.querySelectorAll<HTMLElement>('.gallery-lightbox-item')
  if (originals.length < MIN_SLIDES_FOR_LOOP) return

  const minScrollWidth = () => Math.max(1, viewport.clientWidth) * LOOP_MIN_SCROLL_WIDTH_RATIO

  let passes = 0
  while (container.scrollWidth < minScrollWidth() && passes < MAX_LOOP_DUPLICATE_PASSES) {
    originals.forEach((node) => {
      const clone = node.cloneNode(true) as HTMLElement
      prepareGalleryLoopClone(clone)
      container.appendChild(clone)
    })
    passes += 1
  }
}

function useNativeHorizontalScroll(root: HTMLElement): void {
  for (const vp of root.querySelectorAll<HTMLElement>('[data-gallery-viewport]')) {
    vp.classList.remove('overflow-hidden')
    vp.classList.add('overflow-x-auto', 'overflow-y-hidden', 'touch-pan-x')
  }
  root.setAttribute('data-gallery-reduced-motion', '')
}

function isVerticallyOnScreen(el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect()
  const vh = window.innerHeight || document.documentElement.clientHeight
  return rect.top < vh && rect.bottom > 0
}
