/**
 * Toolbar functionality for printables
 */

import type { PrintableDimensions } from '../../../core/printables/dimensions'
import type { ExportMode, SegmentedControlChangeEvent } from './types'
import { parsePrintableCardDimensions } from './dom-queries'

const CROP_LINES_STORAGE_KEY = 'moumousse-printables-crop-lines-visible'

function showCropMarkOverlays(): void {
  const overlays = document.querySelectorAll('.overlay-image')
  overlays.forEach((overlay) => {
    const img = overlay as HTMLElement
    img.style.display = ''
    img.style.visibility = ''
  })
}

function hideCropMarkOverlays(): void {
  const overlays = document.querySelectorAll('.overlay-image')
  overlays.forEach((overlay) => {
    const img = overlay as HTMLElement
    img.style.display = 'none'
    img.style.visibility = 'hidden'
  })
}

function showPrintableCardMargins(cardEl: HTMLElement): void {
  cardEl.style.removeProperty('padding-left')
  cardEl.style.removeProperty('padding-right')
  cardEl.style.removeProperty('padding-top')
  cardEl.style.removeProperty('padding-bottom')
  cardEl.style.removeProperty('clip-path')
  cardEl.style.removeProperty('overflow')
  cardEl.style.removeProperty('transform')
}

function hidePrintableCardMargins(cardEl: HTMLElement, dimensions: PrintableDimensions): void {
  const initialRect = cardEl.getBoundingClientRect()
  const initialCenterX = initialRect.left + initialRect.width / 2
  const initialCenterY = initialRect.top + initialRect.height / 2

  // Set padding to 0 to hide margins visually
  cardEl.style.setProperty('padding-left', '0', 'important')
  cardEl.style.setProperty('padding-right', '0', 'important')
  cardEl.style.setProperty('padding-top', '0', 'important')
  cardEl.style.setProperty('padding-bottom', '0', 'important')

  // Wait for next frame for padding change to apply
  requestAnimationFrame(() => {
    const rect = cardEl.getBoundingClientRect()

    // Convert dimensions to pixels
    const totalWithBleedWidthMm = dimensions.finishedWidthMm + 2 * dimensions.bleedMm
    const MM_TO_PX = rect.width / totalWithBleedWidthMm
    const bleedPx = dimensions.bleedMm * MM_TO_PX

    // Finished zone starts after bleed
    const cropX = bleedPx
    const cropY = bleedPx
    const finishedWidthPx = dimensions.finishedWidthMm * MM_TO_PX
    const finishedHeightPx = dimensions.finishedHeightMm * MM_TO_PX

    // Clip content to show only finished zone
    const rightCrop = rect.width - cropX - finishedWidthPx
    const bottomCrop = rect.height - cropY - finishedHeightPx

    cardEl.style.setProperty(
      'clip-path',
      `inset(${cropY}px ${rightCrop}px ${bottomCrop}px ${cropX}px)`,
      'important'
    )
    cardEl.style.setProperty('overflow', 'hidden', 'important')

    // Compensate offset to keep center in same place
    requestAnimationFrame(() => {
      const newRect = cardEl.getBoundingClientRect()
      const newCenterX = newRect.left + newRect.width / 2
      const newCenterY = newRect.top + newRect.height / 2

      const offsetX = initialCenterX - newCenterX
      const offsetY = initialCenterY - newCenterY

      if (Math.abs(offsetX) > 0.1 || Math.abs(offsetY) > 0.1) {
        cardEl.style.setProperty('transform', `translate(${offsetX}px, ${offsetY}px)`, 'important')
      }
    })
  })
}

function toggleCropMarkVisibility(show: boolean): void {
  if (show) {
    showCropMarkOverlays()
  } else {
    hideCropMarkOverlays()
  }

  // Hide/show page margins and clip to show result after cutting
  const cards = document.querySelectorAll('[data-dimensions]')
  cards.forEach((card) => {
    const cardEl = card as HTMLElement
    const dimensions = parsePrintableCardDimensions(cardEl)
    if (!dimensions) return

    if (show) {
      showPrintableCardMargins(cardEl)
    } else {
      hidePrintableCardMargins(cardEl, dimensions)
    }
  })

  localStorage.setItem(CROP_LINES_STORAGE_KEY, String(show))
}

function onExportModeChange(e: Event): void {
  const customEvent = e as SegmentedControlChangeEvent
  const { value, controlId } = customEvent.detail

  // Extract faceId from controlId (format: export-mode-{faceId})
  const faceIdMatch = controlId.match(/^export-mode-(.+)$/)
  if (!faceIdMatch) return

  const faceId = faceIdMatch[1]
  const mode = value as ExportMode

  // Update export button
  const exportButton = document.getElementById(`export-button-${faceId}`) as HTMLButtonElement
  if (exportButton) {
    exportButton.setAttribute('data-with-overlay', mode === 'with-overlay' ? 'true' : 'false')
  }

  // Toggle crop lines based on mode
  toggleCropMarkVisibility(mode === 'with-overlay')
}

function restoreExportModePreferences(): void {
  // Restore saved preference or use default (true = with-overlay)
  const saved = localStorage.getItem(CROP_LINES_STORAGE_KEY)
  const shouldShow = saved === null ? true : saved === 'true'
  const initialMode: ExportMode = shouldShow ? 'with-overlay' : 'without-overlay'

  const faceContainers = document.querySelectorAll('[data-toolbar-face]')
  faceContainers.forEach((container) => {
    const faceId = container.getAttribute('data-toolbar-face')
    if (!faceId) return

    // Update export button
    const exportButton = document.getElementById(`export-button-${faceId}`) as HTMLButtonElement
    if (exportButton) {
      exportButton.setAttribute(
        'data-with-overlay',
        initialMode === 'with-overlay' ? 'true' : 'false'
      )
    }

    // Sync segmented control with saved state
    const segmentedControl = document.getElementById(`export-mode-${faceId}`)
    if (segmentedControl) {
      const buttons = segmentedControl.querySelectorAll('button[data-value]')
      buttons.forEach((button) => {
        const buttonValue = button.getAttribute('data-value')
        const isActive = buttonValue === initialMode

        if (!isActive) {
          button.classList.remove('bg-white', 'text-teal-700', 'shadow-sm')
          button.classList.add('text-gray-600')
          button.setAttribute('aria-pressed', 'false')
          return
        }

        button.classList.add('bg-white', 'text-teal-700', 'shadow-sm')
        button.classList.remove('text-gray-600')
        button.setAttribute('aria-pressed', 'true')
      })
    }
  })

  // Initialize crop lines state
  toggleCropMarkVisibility(shouldShow)
}

function calculateAndUpdateTooltipPosition(element: HTMLElement): void {
  const tooltip = element.querySelector('.tooltip-dynamic') as HTMLElement
  if (!tooltip) return

  const rect = element.getBoundingClientRect()
  const tooltipRect = tooltip.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const viewportWidth = window.innerWidth

  // Reset classes
  tooltip.classList.remove(
    'top-full',
    'bottom-full',
    'mt-2',
    'mb-2',
    'left-1/2',
    'right-0',
    'left-0',
    '-translate-x-1/2',
    'translate-x-0'
  )

  // Check vertical space
  const spaceAbove = rect.top
  const spaceBelow = viewportHeight - rect.bottom
  const tooltipHeight = tooltipRect.height || 30

  // Position vertically
  if (spaceBelow >= tooltipHeight + 8) {
    tooltip.classList.add('top-full', 'mt-2')
  } else if (spaceAbove >= tooltipHeight + 8) {
    tooltip.classList.add('bottom-full', 'mb-2')
  } else {
    tooltip.classList.add('top-full', 'mt-2')
  }

  // Check horizontal space
  const spaceLeft = rect.left
  const spaceRight = viewportWidth - rect.right
  const tooltipWidth = tooltipRect.width || 200

  // Position horizontally
  if (spaceLeft >= tooltipWidth / 2 && spaceRight >= tooltipWidth / 2) {
    tooltip.classList.add('left-1/2', '-translate-x-1/2')
    return
  }

  if (spaceRight < tooltipWidth / 2) {
    tooltip.classList.add('right-0', 'translate-x-0')
    return
  }

  tooltip.classList.add('left-0', 'translate-x-0')
}

export function setupPrintablesToolbar(): void {
  document.addEventListener('DOMContentLoaded', () => {
    const toolbar = document.getElementById('printables-toolbar')
    if (toolbar) {
      const height = toolbar.offsetHeight
      document.documentElement.style.setProperty('--toolbar-height', `${height}px`)
    }

    // Handle segmented control changes
    document.addEventListener('segmented-control-change', onExportModeChange)

    // Initialize export modes after the next frame to let SegmentedControl initialize
    requestAnimationFrame(restoreExportModePreferences)

    // Setup tooltips
    const elementsWithTooltips = document.querySelectorAll('.group')
    elementsWithTooltips.forEach((element) => {
      const tooltip = element.querySelector('.tooltip-dynamic')
      if (tooltip) {
        element.addEventListener('mouseenter', () => {
          calculateAndUpdateTooltipPosition(element as HTMLElement)
        })
      }
    })
  })
}
