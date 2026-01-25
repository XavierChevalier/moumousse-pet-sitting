/**
 * Type definitions for printable export functionality
 */

import type { PrintableDimensions } from '../../../core/printables/dimensions'

export type { PrintableDimensions }

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

export interface IFontService {
  ensureFontsReady(): Promise<void>
  getFontEmbedCSS(element: HTMLElement, htmlToImage: HtmlToImageModule): Promise<string>
}

export interface ITextOutlineNormalizer {
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

export interface ButtonState {
  originalText: string
  originalDisabled: boolean
}

export interface CropCoordinates {
  cropX: number
  cropY: number
  finishedWidthPx: number
  finishedHeightPx: number
  targetFinishedWidthPx: number
  targetFinishedHeightPx: number
  fullImageScale: number
}

interface WindowWithExportInit extends Window {
  [GLOBAL_INIT_KEY]?: boolean
  [GLOBAL_CLEANUP_KEY]?: () => void
}

declare global {
  interface Window extends WindowWithExportInit {}
}

export const GLOBAL_INIT_KEY = '__moumousse_printables_export_init__'
export const GLOBAL_CLEANUP_KEY = '__moumousse_printables_export_cleanup__'
