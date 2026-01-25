/**
 * Export calculator for printable exports
 * Calculates crop coordinates for final export
 */

import type { PrintableDimensions, CropCoordinates } from '../types'
import { MIN_DIMENSION_MM, MIN_ELEMENT_SIZE_PX, MM_TO_INCH } from '../constants'

export class ExportCalculator {
  calculateCropCoordinates(element: HTMLElement, dimensions: PrintableDimensions): CropCoordinates {
    // Validation
    if (dimensions.pageWidthMm < MIN_DIMENSION_MM || dimensions.pageHeightMm < MIN_DIMENSION_MM) {
      throw new Error(`Invalid dimensions: page size must be at least ${MIN_DIMENSION_MM}mm`)
    }

    const rect = element.getBoundingClientRect()
    if (rect.width < MIN_ELEMENT_SIZE_PX || rect.height < MIN_ELEMENT_SIZE_PX) {
      throw new Error(`Element too small: ${rect.width}x${rect.height}px`)
    }

    const MM_TO_PX = rect.width / dimensions.pageWidthMm
    if (!Number.isFinite(MM_TO_PX) || MM_TO_PX <= 0) {
      throw new Error('Invalid conversion ratio: element dimensions do not match page dimensions')
    }

    // Dimensions in pixels
    const finishedWidthPx = dimensions.finishedWidthMm * MM_TO_PX
    const finishedHeightPx = dimensions.finishedHeightMm * MM_TO_PX
    const bleedPx = dimensions.bleedMm * MM_TO_PX
    const marginXPx = dimensions.pageMarginXmm * MM_TO_PX
    const marginYPx = dimensions.pageMarginYmm * MM_TO_PX

    // Finished zone starts after CSS margins + slot bleed
    const cropX = marginXPx + bleedPx
    const cropY = marginYPx + bleedPx

    // Calculate target resolution for finished zone
    const targetFinishedWidthPx = Math.round(
      dimensions.finishedWidthMm * MM_TO_INCH * dimensions.dpi
    )
    const targetFinishedHeightPx = Math.round(
      dimensions.finishedHeightMm * MM_TO_INCH * dimensions.dpi
    )

    // Scale for export at correct resolution
    const fullImageScale = dimensions.targetWidthPx / rect.width
    if (!Number.isFinite(fullImageScale) || fullImageScale <= 0) {
      throw new Error('Invalid scale calculation')
    }

    return {
      cropX,
      cropY,
      finishedWidthPx,
      finishedHeightPx,
      targetFinishedWidthPx,
      targetFinishedHeightPx,
      fullImageScale,
    }
  }
}
