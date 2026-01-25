/**
 * Type declarations for html-to-image library loaded from CDN
 * This module is dynamically imported at runtime from https://esm.sh/html-to-image@1.11.11
 */
declare module 'https://esm.sh/html-to-image@1.11.11' {
  export interface Options {
    pixelRatio?: number
    backgroundColor?: string
    canvasWidth?: number
    canvasHeight?: number
    fontEmbedCSS?: string
    preferredFontFormat?: 'woff' | 'woff2' | 'truetype' | 'opentype' | 'svg'
  }

  export function toPng(node: HTMLElement, options?: Options): Promise<string>
  export function getFontEmbedCSS(node: HTMLElement): Promise<string>
}
