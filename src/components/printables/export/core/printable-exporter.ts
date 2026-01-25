/**
 * Printable exporter
 * Exports HTML elements to PNG images for printing
 */

import type {
  PrintableDimensions,
  HtmlToImageModule,
  HtmlToImageOptions,
  IFontService,
  ITextOutlineNormalizer,
  ExportOptions,
} from '../types'
import { CropCoordinatesCalculator } from './crop-coordinates-calculator'
import { CanvasCropper } from './canvas-cropper'
import { ExportingFlag } from './exporting-flag'

export class PrintableExporter {
  constructor(
    private fontService: IFontService,
    private textOutlineNormalizer: ITextOutlineNormalizer,
    private cropCalculator: CropCoordinatesCalculator,
    private canvasCropper: CanvasCropper,
    private exportingFlag: ExportingFlag
  ) {}

  async export(options: ExportOptions): Promise<string> {
    const { element, dimensions, htmlToImage, exportFinal } = options

    await this.fontService.ensureFontsReady()
    this.textOutlineNormalizer.fixTextOutlineElements(element)

    this.exportingFlag.setExporting(true)
    try {
      if (exportFinal) {
        return await this.exportFinal(element, dimensions, htmlToImage)
      }
      return await this.exportWithCropMarks(element, dimensions, htmlToImage)
    } finally {
      this.exportingFlag.setExporting(false)
      this.textOutlineNormalizer.restoreTextOutlineElements(element)
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
    const cropCoords = this.cropCalculator.calculateCropCoordinates(element, dimensions)

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

  private async exportWithCropMarks(
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
