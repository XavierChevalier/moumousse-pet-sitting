import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

class FakeClassList {
  private readonly names = new Set<string>()

  constructor(initial: string[] = []) {
    initial.forEach((name) => this.names.add(name))
  }

  add(...tokens: string[]): void {
    tokens.forEach((token) => this.names.add(token))
  }

  remove(...tokens: string[]): void {
    tokens.forEach((token) => this.names.delete(token))
  }

  contains(token: string): boolean {
    return this.names.has(token)
  }
}

type FakeAttribute = { name: string; value: string }

function createFakeElement(options?: {
  classNames?: string[]
  attributes?: Record<string, string>
  closestMatch?: HTMLElement | null
}): HTMLElement & {
  attributes: FakeAttribute[]
  classList: FakeClassList
} {
  const attrs = new Map(Object.entries(options?.attributes ?? {}))
  const element = {
    attributes: [...attrs.entries()].map(([name, value]) => ({ name, value })),
    classList: new FakeClassList(options?.classNames),
    setAttribute(name: string, value: string) {
      attrs.set(name, value)
      syncAttributes()
    },
    removeAttribute(name: string) {
      attrs.delete(name)
      syncAttributes()
    },
    getAttribute(name: string) {
      return attrs.get(name) ?? null
    },
    closest(selector: string) {
      if (!selector.includes('.gallery-lightbox-item')) return null
      return options?.closestMatch ?? null
    },
  }

  function syncAttributes() {
    element.attributes = [...attrs.entries()].map(([name, value]) => ({ name, value }))
  }

  return element as HTMLElement & {
    attributes: FakeAttribute[]
    classList: FakeClassList
  }
}

describe('gallery embla interactions', () => {
  it('marks already loaded lightbox thumbnail blur images after the host is moved outside the gallery root', async () => {
    const lightboxModule = await import('./gallery-embla-lightbox')

    expect(lightboxModule.setupLightboxBlurImageLoadedState).toBeTypeOf('function')

    const loadedThumb = {
      complete: true,
      naturalWidth: 64,
      dataset: {},
      classList: new FakeClassList(['gallery-blur-img']),
    } as unknown as HTMLImageElement
    const pendingThumb = {
      complete: false,
      naturalWidth: 0,
      dataset: {},
      classList: new FakeClassList(['gallery-blur-img']),
    } as unknown as HTMLImageElement
    const host = createFakeElement()
    host.addEventListener = (() => undefined) as HTMLElement['addEventListener']
    host.querySelectorAll = ((selector: string) =>
      selector.includes('.gallery-blur-img')
        ? [loadedThumb, pendingThumb]
        : []) as unknown as HTMLElement['querySelectorAll']

    lightboxModule.setupLightboxBlurImageLoadedState?.(host)

    expect(loadedThumb.dataset.loaded).toBe('true')
    expect(pendingThumb.dataset.loaded).toBeUndefined()
  })

  it('keeps a gap between the first and last lightbox slides in loop mode', async () => {
    const source = await readFile(
      new URL('../components/galleries/GalleryLightbox.astro', import.meta.url),
      'utf8'
    )

    expect(source).toMatch(
      /\.gallery-lightbox-embla__slide:last-child\s*\{[^}]*margin-inline-end:\s*var\(--lightbox-slide-gap\)/s
    )
  })

  it('moves the fixed lightbox host to body so section containment cannot constrain it', async () => {
    const lightboxModule = await import('./gallery-embla-lightbox')

    expect(lightboxModule.portalLightboxHostToBody).toBeTypeOf('function')

    const section = createFakeElement()
    const host = createFakeElement()
    Object.defineProperty(host, 'parentElement', {
      configurable: true,
      value: section,
    })
    const body = createFakeElement()
    const appended: HTMLElement[] = []
    body.appendChild = ((child: HTMLElement) => {
      appended.push(child)
      Object.defineProperty(child, 'parentElement', {
        configurable: true,
        value: body,
      })
      return child
    }) as HTMLElement['appendChild']

    lightboxModule.portalLightboxHostToBody?.(host, body)

    expect(appended).toEqual([host])
    expect(host.parentElement).toBe(body)
  })

  it('keeps duplicated slides clickable while still marking them as marquee clones', async () => {
    const galleryInitModule = await import('./gallery-embla-init')

    expect(galleryInitModule.prepareGalleryLoopClone).toBeTypeOf('function')

    const clone = createFakeElement({
      classNames: ['gallery-lightbox-item'],
      attributes: {
        'data-index': '4',
        'data-title': 'Ottawa & Leika',
        'data-subtitle': 'mes 2 amours',
      },
    })

    galleryInitModule.prepareGalleryLoopClone?.(clone)

    expect(clone.classList.contains('gallery-lightbox-item')).toBe(true)
    expect(clone.classList.contains('gallery-embla-clone')).toBe(true)
    expect(clone.classList.contains('pointer-events-none')).toBe(false)
    expect(clone.getAttribute('data-index')).toBe('4')
    expect(clone.getAttribute('data-title')).toBe('Ottawa & Leika')
    expect(clone.getAttribute('aria-hidden')).toBe('true')
  })

  it('finds a lightbox trigger from a nested click target', async () => {
    const lightboxModule = await import('./gallery-embla-lightbox')

    expect(lightboxModule.resolveLightboxTrigger).toBeTypeOf('function')

    const trigger = createFakeElement({
      classNames: ['gallery-lightbox-item'],
      attributes: {
        'data-index': '2',
      },
    })
    const nestedTarget = createFakeElement({ closestMatch: trigger })
    const orphanTarget = createFakeElement()

    expect(lightboxModule.resolveLightboxTrigger?.(nestedTarget)).toBe(trigger)
    expect(lightboxModule.resolveLightboxTrigger?.(orphanTarget)).toBeNull()
  })
})
