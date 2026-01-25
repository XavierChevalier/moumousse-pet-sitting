/**
 * Ruler functionality for printables
 */

import { findVisiblePrintableCard, parsePrintableCardDimensions } from './dom-queries'

interface RulerElements {
  horizontalRuler: HTMLCanvasElement
  verticalRuler: HTMLCanvasElement
  horizontalMarker: HTMLElement
  verticalMarker: HTMLElement
  horizontalValue: HTMLElement
  verticalValue: HTMLElement
  corner: HTMLElement
}

import type { PrintableDimensions } from '../../../core/printables/dimensions'

type Dimensions = Pick<
  PrintableDimensions,
  'totalWithBleedWidthMm' | 'totalWithBleedHeightMm' | 'pageMarginXmm' | 'pageMarginYmm'
>

function positionRulerElement(
  element: HTMLElement,
  left: number,
  top: number,
  width: number,
  height: number
): void {
  element.style.setProperty('position', 'fixed', 'important')
  element.style.setProperty('left', `${left}px`, 'important')
  element.style.setProperty('top', `${top}px`, 'important')
  element.style.setProperty('width', `${width}px`, 'important')
  element.style.setProperty('height', `${height}px`, 'important')
}

function configureRulerCanvasForRetina(
  canvas: HTMLCanvasElement,
  width: number,
  height: number
): void {
  const dpr = window.devicePixelRatio || 1
  canvas.width = width * dpr
  canvas.height = height * dpr
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
}

function positionRulerMarker(
  marker: HTMLElement,
  left: number,
  top: number,
  display: 'block' | 'none' = 'block'
): void {
  marker.style.setProperty('position', 'fixed', 'important')
  marker.style.setProperty('left', `${left}px`, 'important')
  marker.style.setProperty('top', `${top}px`, 'important')
  marker.style.setProperty('display', display, 'important')
}

function positionRulerValueLabel(
  label: HTMLElement,
  text: string,
  left: number,
  top: number,
  display: 'block' | 'none' = 'block'
): void {
  label.textContent = text
  label.style.setProperty('position', 'fixed', 'important')
  label.style.setProperty('left', `${left}px`, 'important')
  label.style.setProperty('top', `${top}px`, 'important')
  label.style.setProperty('display', display, 'important')
}

function setupRulerCorner(corner: HTMLElement, left: number, top: number): void {
  positionRulerElement(corner, left, top, 20, 20)
  corner.style.setProperty('background-color', '#ffffff', 'important')
  corner.style.setProperty('border-right', '1px solid #e5e7eb', 'important')
  corner.style.setProperty('border-bottom', '1px solid #e5e7eb', 'important')
  corner.style.setProperty('z-index', '96', 'important')
}

function queryRulerElements(rulerContainer: Element): RulerElements | null {
  const horizontalRuler = rulerContainer.querySelector(
    '[data-ruler="horizontal"]'
  ) as HTMLCanvasElement
  const verticalRuler = rulerContainer.querySelector('[data-ruler="vertical"]') as HTMLCanvasElement
  const horizontalMarker = document.querySelector('[data-marker="horizontal"]') as HTMLElement
  const verticalMarker = document.querySelector('[data-marker="vertical"]') as HTMLElement
  const horizontalValue = document.querySelector('[data-value="horizontal"]') as HTMLElement
  const verticalValue = document.querySelector('[data-value="vertical"]') as HTMLElement
  const corner = rulerContainer.querySelector('.ruler-corner') as HTMLElement

  if (
    !horizontalRuler ||
    !verticalRuler ||
    !horizontalMarker ||
    !verticalMarker ||
    !horizontalValue ||
    !verticalValue ||
    !corner
  ) {
    return null
  }

  return {
    horizontalRuler,
    verticalRuler,
    horizontalMarker,
    verticalMarker,
    horizontalValue,
    verticalValue,
    corner,
  }
}

function attachRulerEventListeners(elements: RulerElements, cardElement: HTMLElement): void {
  const resizeObserver = new ResizeObserver(() => {
    updateRulerDisplay(elements)
  })
  resizeObserver.observe(cardElement)

  window.addEventListener('resize', () => updateRulerDisplay(elements))
  window.addEventListener('scroll', () => updateRulerDisplay(elements))

  const main = document.getElementById('printables-main')
  if (main) {
    main.addEventListener('scroll', () => updateRulerDisplay(elements))
  }

  const faceButtons = document.querySelectorAll('[data-face-id]')
  faceButtons.forEach((button) => {
    button.addEventListener('click', () => {
      requestAnimationFrame(() => updateRulerDisplay(elements))
    })
  })

  const mouseMoveHandler = (e: MouseEvent) => handleRulerMouseMove(e, elements)
  document.addEventListener('mousemove', mouseMoveHandler)
}

function renderHorizontalRulerTick(
  ctx: CanvasRenderingContext2D,
  x: number,
  height: number,
  tickLength: number,
  tickMaxY: number,
  isMajor: boolean,
  mm: number,
  labelColor: string
): void {
  const tickBottom = height
  const desiredTickTop = tickBottom - tickLength
  const tickTop = Math.min(desiredTickTop, tickMaxY)
  ctx.beginPath()
  ctx.moveTo(x, tickBottom)
  ctx.lineTo(x, tickTop)
  ctx.stroke()

  if (!isMajor) return

  ctx.fillStyle = labelColor
  ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, Helvetica, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.fillText(String(mm), x, 1)
}

function renderVerticalRulerTick(
  ctx: CanvasRenderingContext2D,
  y: number,
  width: number,
  tickLength: number,
  tickMaxX: number,
  isMajor: boolean,
  mm: number,
  labelColor: string
): void {
  const tickRight = width
  const desiredTickLeft = tickRight - tickLength
  const tickLeft = Math.max(desiredTickLeft, width - tickMaxX)
  ctx.beginPath()
  ctx.moveTo(tickRight, y)
  ctx.lineTo(tickLeft, y)
  ctx.stroke()

  if (!isMajor) return

  ctx.save()
  ctx.translate(5.5, y)
  ctx.rotate(-Math.PI / 2)
  ctx.fillStyle = labelColor
  ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, Helvetica, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(String(mm), 0, 0)
  ctx.restore()
}

function renderRulerCanvas(
  canvas: HTMLCanvasElement,
  isHorizontal: boolean,
  dimensions: Dimensions,
  cardOffset: number,
  rulerLength: number
): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const dpr = window.devicePixelRatio || 1
  const width = canvas.width / dpr
  const height = canvas.height / dpr

  // Clear canvas
  ctx.clearRect(0, 0, width, height)

  // Set background
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)

  // Draw border
  ctx.strokeStyle = '#e5e7eb'
  ctx.lineWidth = 1
  ctx.beginPath()
  if (isHorizontal) {
    ctx.moveTo(0, height - 0.5)
    ctx.lineTo(width, height - 0.5)
  } else {
    ctx.moveTo(width - 0.5, 0)
    ctx.lineTo(width - 0.5, height)
  }
  ctx.stroke()

  // Calculate scale
  const totalWidthMm = dimensions.totalWithBleedWidthMm + dimensions.pageMarginXmm * 2
  const totalHeightMm = dimensions.totalWithBleedHeightMm + dimensions.pageMarginYmm * 2

  const currentCard = findVisiblePrintableCard()
  if (!currentCard) return

  const cardWidthPx = currentCard.getBoundingClientRect().width
  const cardHeightPx = currentCard.getBoundingClientRect().height

  const scaleX = cardWidthPx / totalWidthMm
  const scaleY = cardHeightPx / totalHeightMm
  const scale = isHorizontal ? scaleX : scaleY

  // Calculate mm range
  const pixelsPerMm = scale
  const startMm = Math.floor((0 - cardOffset) / pixelsPerMm)
  const endMm = Math.ceil((rulerLength - cardOffset) / pixelsPerMm)
  const extendedStartMm = startMm - 20
  const extendedEndMm = endMm + 20

  // Colors
  const tickColor = '#6E6E6E'
  const labelColor = '#B0B0B0'

  ctx.strokeStyle = tickColor
  ctx.fillStyle = labelColor
  ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, Helvetica, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'

  for (let mm = extendedStartMm; mm <= extendedEndMm; mm += 1) {
    const position = cardOffset + mm * scale
    if (position < -scale * 2 || position > rulerLength + scale * 2) continue

    const isMajor = mm % 10 === 0
    const isMedium = mm % 5 === 0 && !isMajor

    const rulerHeight = isHorizontal ? height : width
    const tickMaxY = 16
    const tickMaxX = 16

    let tickLength = 3 // minor
    if (isMajor) {
      tickLength = Math.floor(rulerHeight / 2)
    }
    if (isMedium) {
      tickLength = Math.floor(rulerHeight / 3)
    }

    ctx.lineWidth = 1
    ctx.strokeStyle = tickColor

    if (isHorizontal) {
      renderHorizontalRulerTick(
        ctx,
        position,
        height,
        tickLength,
        tickMaxY,
        isMajor,
        mm,
        labelColor
      )
    } else {
      renderVerticalRulerTick(ctx, position, width, tickLength, tickMaxX, isMajor, mm, labelColor)
    }
  }
}

function updateRulerDisplay(elements: RulerElements): void {
  const currentCard = findVisiblePrintableCard()
  if (!currentCard) return

  const toolbar = document.getElementById('printables-toolbar')
  const sidebar = document.getElementById('printables-sidebar')
  if (!toolbar || !sidebar) return

  const cardRect = currentCard.getBoundingClientRect()
  const toolbarRect = toolbar.getBoundingClientRect()
  const sidebarRect = sidebar.getBoundingClientRect()

  // Update dimensions if card changed
  const dimensions = parsePrintableCardDimensions(currentCard)
  if (!dimensions) return

  // Position horizontal ruler
  const horizontalRulerLeft = sidebarRect.right
  const horizontalRulerWidth = window.innerWidth - sidebarRect.right
  const horizontalRulerTop = toolbarRect.bottom

  positionRulerElement(
    elements.horizontalRuler,
    horizontalRulerLeft,
    horizontalRulerTop,
    horizontalRulerWidth,
    20
  )
  configureRulerCanvasForRetina(elements.horizontalRuler, horizontalRulerWidth, 20)

  // Position vertical ruler
  const verticalRulerLeft = sidebarRect.right
  const verticalRulerTop = toolbarRect.bottom
  const verticalRulerHeight = window.innerHeight - toolbarRect.bottom

  positionRulerElement(
    elements.verticalRuler,
    verticalRulerLeft,
    verticalRulerTop,
    20,
    verticalRulerHeight
  )
  configureRulerCanvasForRetina(elements.verticalRuler, 20, verticalRulerHeight)

  // Position corner
  setupRulerCorner(elements.corner, sidebarRect.right, toolbarRect.bottom)

  // Calculate card offset
  const cardOffsetX = cardRect.left - horizontalRulerLeft
  const cardOffsetY = cardRect.top - horizontalRulerTop

  // Scale context for retina displays and draw rulers
  const hCtx = elements.horizontalRuler.getContext('2d')
  const vCtx = elements.verticalRuler.getContext('2d')
  if (hCtx && vCtx) {
    const dpr = window.devicePixelRatio || 1
    hCtx.save()
    vCtx.save()
    hCtx.scale(dpr, dpr)
    vCtx.scale(dpr, dpr)

    renderRulerCanvas(elements.horizontalRuler, true, dimensions, cardOffsetX, horizontalRulerWidth)
    renderRulerCanvas(elements.verticalRuler, false, dimensions, cardOffsetY, verticalRulerHeight)

    hCtx.restore()
    vCtx.restore()
  }
}

function showRulerMarkers(
  elements: RulerElements,
  clientX: number,
  clientY: number,
  toolbarBottom: number,
  sidebarRight: number
): void {
  positionRulerMarker(elements.horizontalMarker, clientX, toolbarBottom)
  positionRulerMarker(elements.verticalMarker, sidebarRight, clientY)
}

function showRulerValueLabels(
  elements: RulerElements,
  mmX: number,
  mmY: number,
  clientX: number,
  clientY: number,
  toolbarBottom: number,
  sidebarRight: number
): void {
  positionRulerValueLabel(
    elements.horizontalValue,
    `${mmX.toFixed(1)} mm`,
    clientX + 4,
    toolbarBottom + 2
  )
  positionRulerValueLabel(
    elements.verticalValue,
    `${mmY.toFixed(1)} mm`,
    sidebarRight + 2,
    clientY + 4
  )
}

function hideRulerMarkersAndLabels(elements: RulerElements): void {
  positionRulerMarker(elements.horizontalMarker, 0, 0, 'none')
  positionRulerMarker(elements.verticalMarker, 0, 0, 'none')
  positionRulerValueLabel(elements.horizontalValue, '', 0, 0, 'none')
  positionRulerValueLabel(elements.verticalValue, '', 0, 0, 'none')
}

function handleRulerMouseMove(e: MouseEvent, elements: RulerElements): void {
  const toolbar = document.getElementById('printables-toolbar')
  const sidebar = document.getElementById('printables-sidebar')
  if (!toolbar || !sidebar) {
    hideRulerMarkersAndLabels(elements)
    return
  }

  const toolbarRect = toolbar.getBoundingClientRect()
  const sidebarRect = sidebar.getBoundingClientRect()

  const isInViewport = e.clientY >= toolbarRect.bottom && e.clientX >= sidebarRect.right
  if (!isInViewport) {
    hideRulerMarkersAndLabels(elements)
    return
  }

  const currentCard = findVisiblePrintableCard()
  if (!currentCard) {
    showRulerMarkers(elements, e.clientX, e.clientY, toolbarRect.bottom, sidebarRect.right)
    positionRulerValueLabel(elements.horizontalValue, '', 0, 0, 'none')
    positionRulerValueLabel(elements.verticalValue, '', 0, 0, 'none')
    return
  }

  const cardRect = currentCard.getBoundingClientRect()
  const dimensions = parsePrintableCardDimensions(currentCard)

  showRulerMarkers(elements, e.clientX, e.clientY, toolbarRect.bottom, sidebarRect.right)

  if (!dimensions) {
    hideRulerMarkersAndLabels(elements)
    return
  }

  const totalWidthMm = dimensions.totalWithBleedWidthMm + dimensions.pageMarginXmm * 2
  const totalHeightMm = dimensions.totalWithBleedHeightMm + dimensions.pageMarginYmm * 2
  const scaleX = cardRect.width / totalWidthMm
  const scaleY = cardRect.height / totalHeightMm

  const relativeX = e.clientX - cardRect.left
  const relativeY = e.clientY - cardRect.top

  const mmX = relativeX / scaleX
  const mmY = relativeY / scaleY

  showRulerValueLabels(
    elements,
    mmX,
    mmY,
    e.clientX,
    e.clientY,
    toolbarRect.bottom,
    sidebarRect.right
  )
}

export function setupPrintablesRuler(): void {
  function attemptRulerInitialization(): void {
    const rulerContainer = document.querySelector('[data-ruler="main"]')
    if (!rulerContainer) {
      requestAnimationFrame(attemptRulerInitialization)
      return
    }

    const cardElement = findVisiblePrintableCard()
    if (!cardElement) {
      requestAnimationFrame(attemptRulerInitialization)
      return
    }

    const dimensions = parsePrintableCardDimensions(cardElement)
    if (!dimensions) {
      requestAnimationFrame(attemptRulerInitialization)
      return
    }

    const elements = queryRulerElements(rulerContainer)
    if (!elements) {
      requestAnimationFrame(attemptRulerInitialization)
      return
    }

    // Initial setup
    updateRulerDisplay(elements)

    // Setup event listeners
    attachRulerEventListeners(elements, cardElement)

    console.log('Ruler: Successfully initialized with canvas')
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      requestAnimationFrame(attemptRulerInitialization)
    })
    return
  }

  requestAnimationFrame(attemptRulerInitialization)
}
