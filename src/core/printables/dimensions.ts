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

export function createPrintableDimensions({
  dpiMultiplier,
  baseDpi,
  finishedWidthMm,
  finishedHeightMm,
  bleedMm,
  safeZoneMm,
  contentPaddingMm,
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
    pageMarginXmm: (pageWidthMm - totalWithBleedWidthMm) / 2,
    pageMarginYmm: (pageHeightMm - totalWithBleedHeightMm) / 2,
  }
}

