export interface PrintableDimensionsInput {
  dpiMultiplier: number
  baseDpi: number

  /** Trim size (finished) */
  finishedWidthMm: number
  finishedHeightMm: number

  /** Bleed per side */
  bleedMm: number

  /** Recommended safe zone per side */
  safeZoneMm: number

  /** Inner padding used inside printable components */
  contentPaddingMm: number

  /**
   * Crop mark offset from page edge in mm (for "Après découpe" mode)
   * If not provided, defaults to pageMargin + bleed
   */
  cropMarkOffsetFromPageEdgeMm?: number

  /**
   * One of:
   * - Provide the final page size in mm (recommended when you know it)
   * - Or provide the required output size in px at baseDpi (useful when requirements are pixel-based)
   */
  pageWidthMm?: number
  pageHeightMm?: number
  baseTargetWidthPx?: number
  baseTargetHeightPx?: number
}

export interface PrintableDimensions {
  dpi: number
  finishedWidthMm: number
  finishedHeightMm: number
  bleedMm: number
  safeZoneMm: number
  contentPaddingMm: number
  totalWithBleedWidthMm: number
  totalWithBleedHeightMm: number
  safeAreaWidthMm: number
  safeAreaHeightMm: number
  pageWidthMm: number
  pageHeightMm: number
  targetWidthPx: number
  targetHeightPx: number
  pageMarginXmm: number
  pageMarginYmm: number
  cropMarkOffsetFromPageEdgeMm?: number
}

function computePageMmFromBaseTargetPx({
  baseTargetWidthPx,
  baseTargetHeightPx,
  baseDpi,
}: {
  baseTargetWidthPx: number
  baseTargetHeightPx: number
  baseDpi: number
}): { pageWidthMm: number; pageHeightMm: number } {
  return {
    pageWidthMm: (baseTargetWidthPx / baseDpi) * 25.4,
    pageHeightMm: (baseTargetHeightPx / baseDpi) * 25.4,
  }
}

function computeTargetPxFromPageMm({
  pageWidthMm,
  pageHeightMm,
  dpi,
}: {
  pageWidthMm: number
  pageHeightMm: number
  dpi: number
}): { targetWidthPx: number; targetHeightPx: number } {
  const MM_TO_INCH = 1 / 25.4
  return {
    targetWidthPx: Math.round(pageWidthMm * MM_TO_INCH * dpi),
    targetHeightPx: Math.round(pageHeightMm * MM_TO_INCH * dpi),
  }
}

/**
 * Creates a complete dimensions object for printables
 * 
 * Calculates all dimensions needed for exporting a printable:
 * - Finished dimensions (trim size)
 * - Dimensions with bleed
 * - Safe zones
 * - Page margins
 * - Target resolution in pixels based on DPI
 * 
 * @param input - Printable dimensions parameters
 * @param input.dpiMultiplier - Base DPI multiplier (e.g., 2 for 600 DPI from 300)
 * @param input.baseDpi - Base DPI (e.g., 300)
 * @param input.finishedWidthMm - Finished width in mm (trim size)
 * @param input.finishedHeightMm - Finished height in mm (trim size)
 * @param input.bleedMm - Bleed per side in mm
 * @param input.safeZoneMm - Recommended safe zone per side in mm
 * @param input.contentPaddingMm - Inner padding used in components in mm
 * @param input.cropMarkOffsetFromPageEdgeMm - Crop mark offset from page edge in mm (optional)
 * @param input.pageWidthMm - Page width in mm (optional, alternative to baseTargetWidthPx)
 * @param input.pageHeightMm - Page height in mm (optional, alternative to baseTargetHeightPx)
 * @param input.baseTargetWidthPx - Target width in pixels at base DPI (optional, alternative to pageWidthMm)
 * @param input.baseTargetHeightPx - Target height in pixels at base DPI (optional, alternative to pageHeightMm)
 * 
 * @returns PrintableDimensions object with all calculated dimensions
 * 
 * @throws {Error} If neither pageWidthMm/pageHeightMm nor baseTargetWidthPx/baseTargetHeightPx are provided
 * 
 * @example
 * ```typescript
 * const dimensions = createPrintableDimensions({
 *   dpiMultiplier: 2,
 *   baseDpi: 300,
 *   finishedWidthMm: 85,
 *   finishedHeightMm: 54,
 *   bleedMm: 2,
 *   safeZoneMm: 3,
 *   contentPaddingMm: 4,
 *   baseTargetWidthPx: 1347,
 *   baseTargetHeightPx: 981,
 * })
 * ```
 */
export function createPrintableDimensions({
  dpiMultiplier,
  baseDpi,
  finishedWidthMm,
  finishedHeightMm,
  bleedMm,
  safeZoneMm,
  contentPaddingMm,
  cropMarkOffsetFromPageEdgeMm,
  pageWidthMm: pageWidthMmInput,
  pageHeightMm: pageHeightMmInput,
  baseTargetWidthPx,
  baseTargetHeightPx,
}: PrintableDimensionsInput): PrintableDimensions {
  const hasPageMm = typeof pageWidthMmInput === 'number' && typeof pageHeightMmInput === 'number'
  const hasBaseTargetPx =
    typeof baseTargetWidthPx === 'number' && typeof baseTargetHeightPx === 'number'

  if (!hasPageMm && !hasBaseTargetPx) {
    throw new Error(
      'createPrintableDimensions: provide either pageWidthMm/pageHeightMm OR baseTargetWidthPx/baseTargetHeightPx.'
    )
  }

  const { pageWidthMm, pageHeightMm } = hasPageMm
    ? { pageWidthMm: pageWidthMmInput!, pageHeightMm: pageHeightMmInput! }
    : computePageMmFromBaseTargetPx({
        baseTargetWidthPx: baseTargetWidthPx!,
        baseTargetHeightPx: baseTargetHeightPx!,
        baseDpi,
      })

  const dpi = baseDpi * dpiMultiplier
  const { targetWidthPx, targetHeightPx } = computeTargetPxFromPageMm({ pageWidthMm, pageHeightMm, dpi })

  const totalWithBleedWidthMm = finishedWidthMm + bleedMm * 2
  const totalWithBleedHeightMm = finishedHeightMm + bleedMm * 2

  const pageMarginXmm = (pageWidthMm - totalWithBleedWidthMm) / 2
  const pageMarginYmm = (pageHeightMm - totalWithBleedHeightMm) / 2

  return {
    dpi,
    finishedWidthMm,
    finishedHeightMm,
    bleedMm,
    safeZoneMm,
    contentPaddingMm,
    totalWithBleedWidthMm,
    totalWithBleedHeightMm,
    safeAreaWidthMm: finishedWidthMm - safeZoneMm * 2,
    safeAreaHeightMm: finishedHeightMm - safeZoneMm * 2,
    pageWidthMm,
    pageHeightMm,
    targetWidthPx,
    targetHeightPx,
    pageMarginXmm,
    pageMarginYmm,
    cropMarkOffsetFromPageEdgeMm,
  }
}

