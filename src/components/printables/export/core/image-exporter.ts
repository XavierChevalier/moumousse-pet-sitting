/**
 * Image exporter for printable exports
 * Exports HTML elements to PNG images
 */

import type {
  PrintableDimensions,
  HtmlToImageModule,
  HtmlToImageOptions,
  IFontService,
  ITextOutlineFixer,
  ExportOptions,
} from '../types'
import { ExportCalculator } from './export-calculator'
import { CanvasCropper } from './canvas-cropper'
import { ExportStateManager } from './export-state-manager'

export class ImageExporter {
  constructor(
    private fontService: IFontService,
    private textOutlineFixer: ITextOutlineFixer,
    private exportCalculator: ExportCalculator,
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
        return await this.exportFinalVersion(element, dimensions, htmlToImage)
      }
      return await this.exportWithGuides(element, dimensions, htmlToImage)
    } finally {
      this.stateManager.setExporting(false)
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

  private async exportFinalVersion(
    element: HTMLElement,
    dimensions: PrintableDimensions,
    htmlToImage: HtmlToImageModule
  ): Promise<string> {
    const cropCoords = this.exportCalculator.calculateCropCoordinates(element, dimensions)

    // Export full element at high resolution
    const fullImage = await this.exportToPng(element, htmlToImage, {
      pixelRatio: cropCoords.fullImageScale,
    })

    // Calculate coordinates in exported image (after scale)
    const sourceX = cropCoords.cropX * cropCoords.fullImageScale
    const sourceY = cropCoords.cropY * cropCoords.fullImageScale
    const sourceWidth = cropCoords.finishedWidthPx * cropCoords.fullImageScale
    const sourceHeight = cropCoords.finishedHeightPx * cropCoords.fullImageScale

    // Crop finished zone
    return await this.canvasCropper.cropImage(
      fullImage,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      cropCoords.targetFinishedWidthPx,
      cropCoords.targetFinishedHeightPx
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
