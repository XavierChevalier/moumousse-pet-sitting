import type { PrintableDimensions } from '../../core/printables/dimensions'

// ============================================================================
// Constants
// ============================================================================

const MM_TO_INCH = 1 / 25.4
const MIN_ELEMENT_SIZE_PX = 1
const MIN_DIMENSION_MM = 0.1
const EXPORT_TIMEOUT_MS = 60000 // 60 seconds
const GLOBAL_INIT_KEY = '__moumousse_printables_export_init__'
const GLOBAL_CLEANUP_KEY = '__moumousse_printables_export_cleanup__'

// ============================================================================
// Types for html-to-image library
// ============================================================================

export interface HtmlToImageOptions {
  pixelRatio?: number
  backgroundColor?: string
  canvasWidth?: number | undefined
  canvasHeight?: number | undefined
  fontEmbedCSS?: string
  preferredFontFormat?: 'woff' | 'woff2' | 'truetype' | 'opentype' | 'svg'
}

export interface HtmlToImageModule {
  toPng(node: HTMLElement, options?: HtmlToImageOptions): Promise<string>
  getFontEmbedCSS(node: HTMLElement): Promise<string>
}

// ============================================================================
// Interfaces (Abstractions for Dependency Inversion)
// ============================================================================

export interface IFontService {
  ensureFontsReady(): Promise<void>
  getFontEmbedCSS(element: HTMLElement, htmlToImage: HtmlToImageModule): Promise<string>
}

export interface ITextOutlineFixer {
  fixTextOutlineElements(element: HTMLElement): void
  restoreTextOutlineElements(element: HTMLElement): void
}

export interface INotificationService {
  showError(message: string, details?: string): void
  showSuccess(message: string): void
}

export interface ExportOptions {
  element: HTMLElement
  dimensions: PrintableDimensions
  htmlToImage: HtmlToImageModule
  exportFinal: boolean
}

export interface PreviewStyles {
  container: string
  closeButton: string
  image: string
  downloadButton: string
  downloadButtonHover: string
}

// ============================================================================
// Font Service - Single Responsibility: Font loading and embedding
// ============================================================================

export class FontService implements IFontService {
  async ensureFontsReady(): Promise<void> {
    try {
      if (document.fonts?.ready) {
        await document.fonts.ready
      }
    } catch {
      // Ignore font loading errors
    }
  }

  async getFontEmbedCSS(element: HTMLElement, htmlToImage: HtmlToImageModule): Promise<string> {
    await this.ensureFontsReady()
    // Ensure webfonts are embedded for consistent metrics (fixes outline offset issues on export)
    return await htmlToImage.getFontEmbedCSS(element)
  }
}

// ============================================================================
// Text Outline Fixer - Single Responsibility: Fix text-outline elements before export
// ============================================================================

export class TextOutlineFixer implements ITextOutlineFixer {
  private readonly originalStyles = new Map<HTMLElement, Map<string, string>>()

  fixTextOutlineElements(element: HTMLElement): void {
    const textOutlineElements = element.querySelectorAll<HTMLElement>('.text-outline')
    textOutlineElements.forEach((el) => {
      // Store original styles for potential restoration
      const originalStyleMap = new Map<string, string>()
      const computedStyle = window.getComputedStyle(el)

      // Store all critical properties in CSS variables
      originalStyleMap.set('--line-height', el.style.getPropertyValue('--line-height'))
      originalStyleMap.set('--font-size', el.style.getPropertyValue('--font-size'))
      originalStyleMap.set('--letter-spacing', el.style.getPropertyValue('--letter-spacing'))
      originalStyleMap.set('--text-color', el.style.getPropertyValue('--text-color'))

      el.style.setProperty('--line-height', computedStyle.lineHeight)
      el.style.setProperty('--font-size', computedStyle.fontSize)
      el.style.setProperty('--letter-spacing', computedStyle.letterSpacing)
      // CRITICAL: Store the computed color to preserve it during export
      // html-to-image may not preserve Tailwind classes, so we force the color
      el.style.setProperty('--text-color', computedStyle.color)
      // Force reflow to ensure styles are applied
      void el.offsetHeight

      this.originalStyles.set(el, originalStyleMap)
    })
  }

  restoreTextOutlineElements(element: HTMLElement): void {
    const textOutlineElements = element.querySelectorAll<HTMLElement>('.text-outline')
    textOutlineElements.forEach((el) => {
      const originalStyleMap = this.originalStyles.get(el)
      if (originalStyleMap) {
        originalStyleMap.forEach((value, property) => {
          if (value) {
            el.style.setProperty(property, value)
          } else {
            el.style.removeProperty(property)
          }
        })
        this.originalStyles.delete(el)
      }
    })
  }
}

// ============================================================================
// Notification Service - Single Responsibility: User feedback
// ============================================================================

export class NotificationService implements INotificationService {
  showError(message: string, details?: string): void {
    // Create a non-blocking notification
    const notification = document.createElement('div')
    notification.className = 'export-notification export-notification-error'
    notification.style.cssText =
      'position: fixed; top: 20px; right: 20px; background: #ef4444; color: white; padding: 16px 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10001; max-width: 400px; animation: slideIn 0.3s ease-out;'
    notification.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 4px;">${this.escapeHtml(message)}</div>
      ${details ? `<div style="font-size: 0.875rem; opacity: 0.9;">${this.escapeHtml(details)}</div>` : ''}
    `

    document.body.appendChild(notification)

    // Auto-remove after 5 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out'
      setTimeout(() => notification.remove(), 300)
    }, 5000)
  }

  showSuccess(message: string): void {
    const notification = document.createElement('div')
    notification.className = 'export-notification export-notification-success'
    notification.style.cssText =
      'position: fixed; top: 20px; right: 20px; background: #10b981; color: white; padding: 16px 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10001; max-width: 400px; animation: slideIn 0.3s ease-out;'
    notification.textContent = message

    document.body.appendChild(notification)

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out'
      setTimeout(() => notification.remove(), 300)
    }, 3000)
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }
}

// ============================================================================
// Final Export Calculator - Single Responsibility: Calculate crop coordinates
// ============================================================================

export class FinalExportCalculator {
  calculateCropCoordinates(
    element: HTMLElement,
    dimensions: PrintableDimensions
  ): {
    cropX: number
    cropY: number
    finishedWidthPx: number
    finishedHeightPx: number
    targetFinishedWidthPx: number
    targetFinishedHeightPx: number
    fullImageScale: number
  } {
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

// ============================================================================
// Canvas Cropper - Single Responsibility: Crop image using canvas
// ============================================================================

export class CanvasCropper {
  async cropImage(
    imageDataUrl: string,
    sourceX: number,
    sourceY: number,
    sourceWidth: number,
    sourceHeight: number,
    targetWidth: number,
    targetHeight: number
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      let isResolved = false
      let timeoutId: ReturnType<typeof setTimeout> | null = null

      const cleanup = () => {
        if (timeoutId !== null) {
          clearTimeout(timeoutId)
          timeoutId = null
        }
      }

      const safeResolve = (value: string) => {
        if (!isResolved) {
          isResolved = true
          cleanup()
          resolve(value)
        }
      }

      const safeReject = (error: Error) => {
        if (!isResolved) {
          isResolved = true
          cleanup()
          reject(error)
        }
      }

      timeoutId = setTimeout(() => {
        safeReject(new Error('Image loading timeout'))
      }, EXPORT_TIMEOUT_MS)

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = targetWidth
          canvas.height = targetHeight
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            safeReject(new Error('Failed to get canvas context'))
            return
          }

          ctx.drawImage(
            img,
            sourceX,
            sourceY, // Source position
            sourceWidth,
            sourceHeight, // Source size
            0,
            0, // Destination position
            targetWidth,
            targetHeight // Destination size
          )

          safeResolve(canvas.toDataURL('image/png'))
        } catch (error) {
          safeReject(error instanceof Error ? error : new Error('Canvas cropping failed'))
        }
      }

      img.onerror = () => {
        safeReject(new Error('Failed to load image for cropping'))
      }

      img.src = imageDataUrl
    })
  }
}

// ============================================================================
// Export State Manager - Single Responsibility: Manage export state
// ============================================================================

export class ExportStateManager {
  private isExporting = false

  setExporting(value: boolean): void {
    if (value === this.isExporting) return

    this.isExporting = value
    if (value) {
      document.documentElement.classList.add('exporting')
    } else {
      document.documentElement.classList.remove('exporting')
    }
  }

  getIsExporting(): boolean {
    return this.isExporting
  }
}

// ============================================================================
// Image Exporter - Single Responsibility: Export element to PNG
// ============================================================================

export class ImageExporter {
  constructor(
    private fontService: IFontService,
    private textOutlineFixer: ITextOutlineFixer,
    private finalExportCalculator: FinalExportCalculator,
    private canvasCropper: CanvasCropper,
    private stateManager: ExportStateManager
  ) {}

  async export(options: ExportOptions): Promise<string> {
    const { element, dimensions, htmlToImage, exportFinal } = options

    await this.fontService.ensureFontsReady()
    this.textOutlineFixer.fixTextOutlineElements(element)

    this.stateManager.setExporting(true)
    try {
      if (exportFinal) {
        return await this.exportFinal(element, dimensions, htmlToImage)
      } else {
        return await this.exportWithGuides(element, dimensions, htmlToImage)
      }
    } finally {
      this.stateManager.setExporting(false)
      // Restore text outline elements
      this.textOutlineFixer.restoreTextOutlineElements(element)
    }
  }

  private async exportToPng(
    element: HTMLElement,
    htmlToImage: HtmlToImageModule,
    options: {
      pixelRatio: number
      canvasWidth?: number
      canvasHeight?: number
    }
  ): Promise<string> {
    const fontEmbedCSS = await this.fontService.getFontEmbedCSS(element, htmlToImage)

    const pngOptions: HtmlToImageOptions = {
      pixelRatio: options.pixelRatio,
      backgroundColor: '#ffffff',
      fontEmbedCSS,
      preferredFontFormat: 'woff2',
    }
    if (options.canvasWidth !== undefined) {
      pngOptions.canvasWidth = options.canvasWidth
    }
    if (options.canvasHeight !== undefined) {
      pngOptions.canvasHeight = options.canvasHeight
    }
    return await htmlToImage.toPng(element, pngOptions)
  }

  private async exportFinal(
    element: HTMLElement,
    dimensions: PrintableDimensions,
    htmlToImage: HtmlToImageModule
  ): Promise<string> {
    const coords = this.finalExportCalculator.calculateCropCoordinates(element, dimensions)

    // Export full element at high resolution
    const fullImage = await this.exportToPng(element, htmlToImage, {
      pixelRatio: coords.fullImageScale,
    })

    // Calculate coordinates in exported image (after scale)
    const sourceX = coords.cropX * coords.fullImageScale
    const sourceY = coords.cropY * coords.fullImageScale
    const sourceWidth = coords.finishedWidthPx * coords.fullImageScale
    const sourceHeight = coords.finishedHeightPx * coords.fullImageScale

    // Crop finished zone
    return await this.canvasCropper.cropImage(
      fullImage,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      coords.targetFinishedWidthPx,
      coords.targetFinishedHeightPx
    )
  }

  private async exportWithGuides(
    element: HTMLElement,
    dimensions: PrintableDimensions,
    htmlToImage: HtmlToImageModule
  ): Promise<string> {
    const rect = element.getBoundingClientRect()
    const scale = dimensions.targetWidthPx / rect.width

    return await this.exportToPng(element, htmlToImage, {
      pixelRatio: scale,
      canvasWidth: dimensions.targetWidthPx,
      canvasHeight: dimensions.targetHeightPx,
    })
  }
}

// ============================================================================
// Overlay Manager - Single Responsibility: Manage overlay visibility
// ============================================================================

export class OverlayManager {
  private visibilityStates = new Map<HTMLElement, boolean>()

  hideOverlay(element: HTMLElement): void {
    const overlayImage = element.querySelector<HTMLImageElement>('.overlay-image')
    if (overlayImage) {
      this.visibilityStates.set(overlayImage, overlayImage.style.display !== 'none')
      overlayImage.style.display = 'none'
    }
  }

  showOverlay(element: HTMLElement): void {
    const overlayImage = element.querySelector<HTMLImageElement>('.overlay-image')
    if (overlayImage) {
      overlayImage.style.display = ''
    }
  }

  setOverlayVisibility(element: HTMLElement, visible: boolean): void {
    if (visible) {
      this.showOverlay(element)
    } else {
      this.hideOverlay(element)
    }
  }

  restoreOverlayVisibility(element: HTMLElement): void {
    const overlayImage = element.querySelector<HTMLImageElement>('.overlay-image')
    if (overlayImage) {
      const wasVisible = this.visibilityStates.get(overlayImage) ?? true
      overlayImage.style.display = wasVisible ? '' : 'none'
      this.visibilityStates.delete(overlayImage)
    }
  }
}

// ============================================================================
// File Downloader - Single Responsibility: Handle file downloads
// ============================================================================

export class FileDownloader {
  download(dataUrl: string, filename: string): void {
    const link = document.createElement('a')
    link.download = filename
    link.href = dataUrl
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    // Clean up after a short delay
    setTimeout(() => {
      // Check if link is still in the DOM before removing
      if (link.parentNode === document.body) {
        document.body.removeChild(link)
      }
    }, 100)
  }

  generateFilename(
    baseFilename: string,
    withOverlay: boolean,
    dimensions: PrintableDimensions
  ): string {
    const suffix = withOverlay ? '' : '-final'
    return `${baseFilename}${suffix}-${dimensions.finishedWidthMm}x${dimensions.finishedHeightMm}.png`
  }
}

// ============================================================================
// Preview Manager - Single Responsibility: Manage preview UI
// ============================================================================

export class PreviewManager {
  private readonly styles: PreviewStyles
  private readonly downloadIconSvg: string
  private activePreviews = new Set<string>()

  constructor(styles?: Partial<PreviewStyles>) {
    this.styles = {
      container:
        'position: fixed; top: 10px; right: 10px; max-width: 600px; max-height: 600px; z-index: 10000; background: white; box-shadow: 0 0 20px rgba(0,0,0,0.5); border-radius: 8px; overflow: hidden;',
      closeButton:
        'position: absolute; top: 8px; right: 8px; width: 32px; height: 32px; background: rgba(0,0,0,0.7); color: white; border: none; border-radius: 50%; cursor: pointer; font-size: 24px; line-height: 1; display: flex; align-items: center; justify-content: center; z-index: 10001;',
      image: 'width: 100%; height: auto; display: block;',
      downloadButton:
        'width: 100%; padding: 12px; background: #3ecfb1; color: white; border: none; font-weight: 600; cursor: pointer; transition: background 0.2s;',
      downloadButtonHover: '#35b89c',
      ...styles,
    }

    this.downloadIconSvg =
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block; vertical-align: middle; margin-right: 4px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>'
  }

  showPreview(targetId: string, dataUrl: string, filename: string, onDownload: () => void): void {
    this.removeExistingPreview(targetId)

    const container = this.createContainer(targetId, filename)
    const closeBtn = this.createCloseButton(container)
    const preview = this.createPreviewImage(dataUrl)
    const downloadBtn = this.createDownloadButton(onDownload)

    container.appendChild(closeBtn)
    container.appendChild(preview)
    container.appendChild(downloadBtn)
    document.body.appendChild(container)
    this.activePreviews.add(targetId)
  }

  private removeExistingPreview(targetId: string): void {
    const existing = document.getElementById(`export-preview-${targetId}`)
    if (existing) {
      existing.remove()
      this.activePreviews.delete(targetId)
    }
  }

  private createContainer(targetId: string, filename: string): HTMLDivElement {
    const container = document.createElement('div')
    container.id = `export-preview-${targetId}`
    container.style.cssText = this.styles.container
    container.setAttribute('title', filename)
    return container
  }

  private createCloseButton(container: HTMLDivElement): HTMLButtonElement {
    const closeBtn = document.createElement('button')
    closeBtn.textContent = '×'
    closeBtn.style.cssText = this.styles.closeButton
    closeBtn.setAttribute('aria-label', 'Close preview')
    closeBtn.addEventListener('click', () => {
      container.remove()
      this.activePreviews.delete(container.id.replace('export-preview-', ''))
    })
    return closeBtn
  }

  private createPreviewImage(dataUrl: string): HTMLImageElement {
    const preview = document.createElement('img')
    preview.src = dataUrl
    preview.style.cssText = this.styles.image
    preview.alt = 'Export preview'
    return preview
  }

  private createDownloadButton(onDownload: () => void): HTMLButtonElement {
    const downloadBtn = document.createElement('button')
    downloadBtn.innerHTML = `${this.downloadIconSvg} Télécharger`
    downloadBtn.style.cssText = this.styles.downloadButton
    downloadBtn.setAttribute('aria-label', 'Download export')

    const handleMouseEnter = () => {
      downloadBtn.style.background = this.styles.downloadButtonHover
    }
    const handleMouseLeave = () => {
      downloadBtn.style.background = '#3ecfb1'
    }

    downloadBtn.addEventListener('mouseenter', handleMouseEnter)
    downloadBtn.addEventListener('mouseleave', handleMouseLeave)
    downloadBtn.addEventListener('click', onDownload)

    return downloadBtn
  }

  cleanup(): void {
    this.activePreviews.forEach((targetId) => {
      this.removeExistingPreview(targetId)
    })
  }
}

// ============================================================================
// Button State Manager - Single Responsibility: Manage button state
// ============================================================================

export class ButtonStateManager {
  saveState(button: HTMLButtonElement): { originalText: string; originalDisabled: boolean } {
    return {
      originalText: button.innerHTML,
      originalDisabled: button.disabled,
    }
  }

  setLoading(button: HTMLButtonElement): void {
    button.disabled = true
    button.innerHTML = 'Export en cours...'
  }

  restoreState(
    button: HTMLButtonElement,
    state: { originalText: string; originalDisabled: boolean }
  ): void {
    button.disabled = state.originalDisabled
    button.innerHTML = state.originalText
  }
}

// ============================================================================
// Export Button Controller - Single Responsibility: Handle export interactions
// ============================================================================

export class ExportButtonController {
  constructor(
    private imageExporter: ImageExporter,
    private overlayManager: OverlayManager,
    private fileDownloader: FileDownloader,
    private previewManager: PreviewManager,
    private buttonStateManager: ButtonStateManager,
    private notificationService: INotificationService,
    private dimensions: PrintableDimensions
  ) {}

  async handleExport(button: HTMLButtonElement): Promise<void> {
    const targetId = button.getAttribute('data-target')
    const filename = button.getAttribute('data-filename')
    const withOverlay = button.getAttribute('data-with-overlay') === 'true'

    if (!targetId || !filename) {
      this.notificationService.showError('Erreur', 'Attributs de données manquants sur le bouton')
      return
    }

    const element = document.getElementById(targetId)
    if (!element) {
      this.notificationService.showError('Erreur', `Élément avec l'id "${targetId}" introuvable`)
      return
    }

    // Manage overlay visibility
    this.overlayManager.setOverlayVisibility(element, withOverlay)

    // Save and set button state
    const buttonState = this.buttonStateManager.saveState(button)
    this.buttonStateManager.setLoading(button)

    try {
      // Dynamic import from CDN - resolved at runtime
      const htmlToImage =
        (await import('https://esm.sh/html-to-image@1.11.11')) as HtmlToImageModule
      const dataUrl = await this.imageExporter.export({
        element,
        dimensions: this.dimensions,
        htmlToImage,
        exportFinal: !withOverlay,
      })

      // Check if preview toggle is enabled
      const previewToggle = document.getElementById(
        `preview-toggle-${targetId}`
      ) as HTMLInputElement | null
      const previewOnly = previewToggle?.checked ?? false

      const downloadFilename = this.fileDownloader.generateFilename(
        filename,
        withOverlay,
        this.dimensions
      )

      if (previewOnly) {
        this.previewManager.showPreview(targetId, dataUrl, downloadFilename, () => {
          this.fileDownloader.download(dataUrl, downloadFilename)
          this.notificationService.showSuccess('Export téléchargé avec succès')
        })
      } else {
        this.fileDownloader.download(dataUrl, downloadFilename)
        this.notificationService.showSuccess('Export téléchargé avec succès')
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue lors de l'export"
      console.error('Export failed:', error)
      this.notificationService.showError("Erreur lors de l'export", errorMessage)
    } finally {
      // Restore overlay visibility
      this.overlayManager.restoreOverlayVisibility(element)
      // Restore button state
      this.buttonStateManager.restoreState(button, buttonState)
    }
  }
}

// ============================================================================
// Initialization and Cleanup
// ============================================================================

interface WindowWithExportInit extends Window {
  [GLOBAL_INIT_KEY]?: boolean
  [GLOBAL_CLEANUP_KEY]?: () => void
}

export function initializeExport(dimensions: PrintableDimensions): () => void {
  const windowWithInit = window as WindowWithExportInit

  // Avoid double initialization
  if (windowWithInit[GLOBAL_INIT_KEY]) {
    return windowWithInit[GLOBAL_CLEANUP_KEY] || (() => {})
  }
  windowWithInit[GLOBAL_INIT_KEY] = true

  // ============================================================================
  // Initialization - Dependency Injection
  // ============================================================================

  const fontService = new FontService()
  const textOutlineFixer = new TextOutlineFixer()
  const finalExportCalculator = new FinalExportCalculator()
  const canvasCropper = new CanvasCropper()
  const stateManager = new ExportStateManager()
  const imageExporter = new ImageExporter(
    fontService,
    textOutlineFixer,
    finalExportCalculator,
    canvasCropper,
    stateManager
  )
  const overlayManager = new OverlayManager()
  const fileDownloader = new FileDownloader()
  const previewManager = new PreviewManager()
  const buttonStateManager = new ButtonStateManager()
  const notificationService = new NotificationService()

  const exportController = new ExportButtonController(
    imageExporter,
    overlayManager,
    fileDownloader,
    previewManager,
    buttonStateManager,
    notificationService,
    dimensions
  )

  // Event delegation handler
  const handleClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement
    const button = target.closest<HTMLButtonElement>('button[data-target][data-filename]')
    if (button) {
      exportController.handleExport(button)
    }
  }

  // Attach event listener with proper cleanup
  document.addEventListener('click', handleClick)

  // Cleanup function
  const cleanup = () => {
    document.removeEventListener('click', handleClick)
    previewManager.cleanup()
    windowWithInit[GLOBAL_INIT_KEY] = false
    delete windowWithInit[GLOBAL_CLEANUP_KEY]
  }

  windowWithInit[GLOBAL_CLEANUP_KEY] = cleanup

  return cleanup
}
