/**
 * Export controller for printable exports
 * Orchestrates the export process and handles user interactions
 */

import type {
  PrintableDimensions,
  HtmlToImageModule,
  INotificationService,
  ExportOptions,
} from './types'
import { GLOBAL_INIT_KEY, GLOBAL_CLEANUP_KEY } from './types'
import { FontService } from './services/font-service'
import { TextOutlineNormalizer } from './services/text-outline-normalizer'
import { NotificationService } from './services/notification-service'
import { CropCoordinatesCalculator } from './core/crop-coordinates-calculator'
import { CanvasCropper } from './core/canvas-cropper'
import { ExportingFlag } from './core/exporting-flag'
import { PrintableExporter } from './core/printable-exporter'
import { CropMarkManager } from './ui/crop-mark-manager'
import { ExportFileDownloader } from './ui/export-file-downloader'
import { ExportPreview } from './ui/export-preview'
import { ExportButtonState } from './ui/export-button-state'

class ExportHandler {
  constructor(
    private printableExporter: PrintableExporter,
    private cropMarkManager: CropMarkManager,
    private fileDownloader: ExportFileDownloader,
    private preview: ExportPreview,
    private buttonState: ExportButtonState,
    private notificationService: INotificationService,
    private dimensions: PrintableDimensions
  ) {}

  async handleExport(button: HTMLButtonElement): Promise<void> {
    const targetId = button.getAttribute('data-target')
    const filename = button.getAttribute('data-filename')
    const withCropMarks = button.getAttribute('data-with-overlay') === 'true'

    if (!targetId || !filename) {
      this.notificationService.showError('Erreur', 'Attributs de données manquants sur le bouton')
      return
    }

    const element = document.getElementById(targetId)
    if (!element) {
      this.notificationService.showError('Erreur', `Élément avec l'id "${targetId}" introuvable`)
      return
    }

    // Manage crop mark visibility
    this.cropMarkManager.setCropMarkVisibility(element, withCropMarks)

    // Save and set button state
    const buttonState = this.buttonState.saveState(button)
    this.buttonState.setLoading(button)

    try {
      // Dynamic import from CDN - resolved at runtime
      const htmlToImage =
        (await import('https://esm.sh/html-to-image@1.11.11')) as HtmlToImageModule
      const dataUrl = await this.printableExporter.export({
        element,
        dimensions: this.dimensions,
        htmlToImage,
        exportFinal: !withCropMarks,
      })

      // Check if preview toggle is enabled
      const previewToggle = document.getElementById(
        `preview-toggle-${targetId}`
      ) as HTMLInputElement | null
      const previewOnly = previewToggle?.checked ?? false

      const downloadFilename = this.fileDownloader.generateFilename(
        filename,
        withCropMarks,
        this.dimensions
      )

      if (previewOnly) {
        this.preview.showPreview(targetId, dataUrl, downloadFilename, () => {
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
      // Restore crop mark visibility
      this.cropMarkManager.restoreCropMarkVisibility(element)
      // Restore button state
      this.buttonState.restoreState(button, buttonState)
    }
  }
}

export function setupPrintableExport(dimensions: PrintableDimensions): () => void {
  const windowWithInit = window as typeof window & {
    [GLOBAL_INIT_KEY]?: boolean
    [GLOBAL_CLEANUP_KEY]?: () => void
  }

  // Avoid double initialization
  if (windowWithInit[GLOBAL_INIT_KEY]) {
    return windowWithInit[GLOBAL_CLEANUP_KEY] || (() => {})
  }
  windowWithInit[GLOBAL_INIT_KEY] = true

  // Dependency Injection
  const fontService = new FontService()
  const textOutlineNormalizer = new TextOutlineNormalizer()
  const cropCalculator = new CropCoordinatesCalculator()
  const canvasCropper = new CanvasCropper()
  const exportingFlag = new ExportingFlag()
  const printableExporter = new PrintableExporter(
    fontService,
    textOutlineNormalizer,
    cropCalculator,
    canvasCropper,
    exportingFlag
  )
  const cropMarkManager = new CropMarkManager()
  const fileDownloader = new ExportFileDownloader()
  const preview = new ExportPreview()
  const buttonState = new ExportButtonState()
  const notificationService = new NotificationService()

  const exportHandler = new ExportHandler(
    printableExporter,
    cropMarkManager,
    fileDownloader,
    preview,
    buttonState,
    notificationService,
    dimensions
  )

  // Event delegation handler
  const handleClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement
    const button = target.closest<HTMLButtonElement>('button[data-target][data-filename]')
    if (button) {
      exportHandler.handleExport(button)
    }
  }

  // Attach event listener with proper cleanup
  document.addEventListener('click', handleClick)

  // Cleanup function
  const cleanup = () => {
    document.removeEventListener('click', handleClick)
    preview.cleanup()
    windowWithInit[GLOBAL_INIT_KEY] = false
    delete windowWithInit[GLOBAL_CLEANUP_KEY]
  }

  windowWithInit[GLOBAL_CLEANUP_KEY] = cleanup

  return cleanup
}
