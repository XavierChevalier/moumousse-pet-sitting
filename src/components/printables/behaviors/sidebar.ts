/**
 * Sidebar thumbnail generation and face navigation
 */

import type { PrintableDimensions } from '../../../core/printables/dimensions'
import { findVisiblePrintableCard, scheduleIdleTask } from './dom-queries'

interface HtmlToImageModule {
  toPng: (node: HTMLElement, options?: any) => Promise<string>
}

const CACHE_KEY_PREFIX = 'moumousse_thumbnail_'
const CACHE_VERSION = '1'

let htmlToImage: HtmlToImageModule | null = null
let htmlToImagePromise: Promise<HtmlToImageModule | null> | null = null

async function loadHtmlToImageModule(): Promise<HtmlToImageModule | null> {
  if (htmlToImagePromise) return htmlToImagePromise
  htmlToImagePromise = import('https://esm.sh/html-to-image@1.11.11')
    .then((module) => {
      htmlToImage = module as HtmlToImageModule
      return htmlToImage
    })
    .catch((error) => {
      console.error('Failed to load html-to-image:', error)
      htmlToImage = null
      return null
    })
  return htmlToImagePromise
}

function buildThumbnailCacheKey(faceId: string): string {
  const pagePath = window.location.pathname
  return `${CACHE_KEY_PREFIX}${CACHE_VERSION}_${pagePath}_${faceId}`
}

function getCachedThumbnail(faceId: string): string | null {
  try {
    const cached = localStorage.getItem(buildThumbnailCacheKey(faceId))
    if (cached?.startsWith('data:image/')) {
      return cached
    }
  } catch (error) {
    console.warn('Failed to read thumbnail cache:', error)
  }
  return null
}

function storeThumbnailInCache(faceId: string, dataUrl: string): void {
  try {
    localStorage.setItem(buildThumbnailCacheKey(faceId), dataUrl)
  } catch (error) {
    console.warn('Failed to cache thumbnail, cleaning old entries:', error)
    try {
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(CACHE_KEY_PREFIX)) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key))
      localStorage.setItem(buildThumbnailCacheKey(faceId), dataUrl)
    } catch (e) {
      console.warn('Could not cache thumbnail after cleanup')
    }
  }
}

async function generateFaceThumbnail(faceId: string, useCache = true): Promise<string | null> {
  const container = document.querySelector(`[data-face-container="${faceId}"]`) as HTMLElement
  if (!container) return null

  const thumbnailContainer = document.querySelector(
    `[data-thumbnail-container="${faceId}"]`
  ) as HTMLElement
  if (!thumbnailContainer) return null

  // Check cache first
  if (useCache) {
    const cached = getCachedThumbnail(faceId)
    if (cached) {
      thumbnailContainer.innerHTML = `<img src="${cached}" alt="${faceId}" class="w-full h-full object-contain" loading="lazy" />`
      return cached
    }
  }

  // Ensure html-to-image is loaded
  const loadedModule = await loadHtmlToImageModule()
  if (!loadedModule || !htmlToImage) {
    console.error('html-to-image module not available')
    thumbnailContainer.innerHTML = `<span class="text-xs text-gray-400 font-medium">Erreur de chargement</span>`
    return null
  }

  // Store original visibility state
  const wasHidden = container.classList.contains('hidden')
  const originalPosition = container.style.position
  const originalLeft = container.style.left
  const originalTop = container.style.top
  const originalZIndex = container.style.zIndex

  try {
    const contentElement = container.querySelector(`#${faceId}`) as HTMLElement
    if (!contentElement) return null

    // Temporarily make the container visible but off-screen
    if (wasHidden) {
      container.classList.remove('hidden')
      container.style.position = 'fixed'
      container.style.left = '-9999px'
      container.style.top = '0'
      container.style.zIndex = '-1'
    }

    // Wait for layout
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))

    if (!htmlToImage?.toPng) {
      throw new Error('toPng method not found on html-to-image module')
    }

    const dataUrl = await htmlToImage.toPng(contentElement, {
      width: contentElement.offsetWidth || contentElement.scrollWidth,
      height: contentElement.offsetHeight || contentElement.scrollHeight,
      pixelRatio: 0.25,
      cacheBust: false,
    })

    // Restore original state
    if (wasHidden) {
      container.classList.add('hidden')
      container.style.position = originalPosition
      container.style.left = originalLeft
      container.style.top = originalTop
      container.style.zIndex = originalZIndex
    }

    // Cache and display thumbnail
    storeThumbnailInCache(faceId, dataUrl)
    thumbnailContainer.innerHTML = `<img src="${dataUrl}" alt="${faceId}" class="w-full h-full object-contain" loading="lazy" />`
    return dataUrl
  } catch (error) {
    console.error(`Failed to generate thumbnail for ${faceId}:`, error)
    thumbnailContainer.innerHTML = `<span class="text-xs text-gray-400 font-medium">Erreur</span>`

    // Restore state even on error
    if (wasHidden) {
      container.classList.add('hidden')
      container.style.position = originalPosition
      container.style.left = originalLeft
      container.style.top = originalTop
      container.style.zIndex = originalZIndex
    }
    return null
  }
}

async function generateAllFaceThumbnails(initialCurrentFaceId: string): Promise<void> {
  // Generate current face first (priority)
  if (initialCurrentFaceId) {
    await generateFaceThumbnail(initialCurrentFaceId)
  }

  // Then generate others in parallel
  const faceButtons = document.querySelectorAll('[data-face-id]')
  const otherThumbnailPromises = Array.from(faceButtons)
    .filter((btn) => btn.getAttribute('data-face-id') !== initialCurrentFaceId)
    .map(async (button) => {
      const faceId = button.getAttribute('data-face-id')
      if (faceId) {
        return generateFaceThumbnail(faceId)
      }
    })

  await Promise.all(otherThumbnailPromises)
}

function setupPrintableFaceNavigation(initialCurrentFaceId: string): void {
  const faceButtons = document.querySelectorAll('[data-face-id]')
  const faceContainers = document.querySelectorAll('[data-face-container]')

  faceButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const faceId = button.getAttribute('data-face-id')
      if (!faceId) return

      switchToPrintableFace(faceId, faceButtons, faceContainers, button)
    })
  })

  ensureInitialFaceState(faceContainers, initialCurrentFaceId)
}

function switchToPrintableFace(
  faceId: string,
  faceButtons: NodeListOf<Element>,
  faceContainers: NodeListOf<Element>,
  clickedButton: Element
): void {
  // Hide all faces
  faceContainers.forEach((container) => {
    container.classList.add('hidden')
    container.classList.remove('flex')
  })

  // Show selected face
  const selectedContainer = document.querySelector(`[data-face-container="${faceId}"]`)
  if (selectedContainer) {
    selectedContainer.classList.remove('hidden')
    selectedContainer.classList.add('flex')
  }

  // Update active state in sidebar
  updateSidebarActiveState(faceButtons, clickedButton)

  // Update toolbar buttons to target the new face
  updateToolbarForFace(faceId, clickedButton)
}

function updateSidebarActiveState(faceButtons: NodeListOf<Element>, activeButton: Element): void {
  faceButtons.forEach((btn) => {
    btn.classList.remove('border-teal-500', 'bg-teal-50', 'shadow-md')
    btn.classList.add('border-gray-200', 'bg-white')
    btn.removeAttribute('aria-current')
  })
  activeButton.classList.remove('border-gray-200', 'bg-white')
  activeButton.classList.add('border-teal-500', 'bg-teal-50', 'shadow-md')
  activeButton.setAttribute('aria-current', 'true')
}

function updateToolbarForFace(faceId: string, button: Element): void {
  const toolbarContainer = document.querySelector('[data-toolbar-face]')
  if (!toolbarContainer) return

  const buttons = toolbarContainer.querySelectorAll('[data-target]')
  const label = button.querySelector('span')?.textContent?.trim() || ''
  const filename = label.toLowerCase().replace(/\s+/g, '-')

  buttons.forEach((btn) => {
    btn.setAttribute('data-target', faceId)
    btn.setAttribute('data-filename', filename)
  })

  // Update preview toggle
  const previewToggle = toolbarContainer.querySelector('input[type="checkbox"]')
  if (previewToggle) {
    previewToggle.id = `preview-toggle-${faceId}`
  }

  toolbarContainer.setAttribute('data-toolbar-face', faceId)
}

function ensureInitialFaceState(
  faceContainers: NodeListOf<Element>,
  initialCurrentFaceId: string
): void {
  faceContainers.forEach((container) => {
    const containerId = container.getAttribute('data-face-container')
    if (containerId !== initialCurrentFaceId) {
      container.classList.add('hidden')
      container.classList.remove('flex')
      return
    }

    container.classList.remove('hidden')
    container.classList.add('flex')
  })
}

export function setupPrintablesSidebar(initialCurrentFaceId: string): void {
  document.addEventListener('DOMContentLoaded', async () => {
    setupPrintableFaceNavigation(initialCurrentFaceId)

    scheduleIdleTask(() => {
      generateAllFaceThumbnails(initialCurrentFaceId)
    })
  })
}
