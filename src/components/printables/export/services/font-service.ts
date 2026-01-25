/**
 * Font service for printable exports
 * Handles font loading and embedding for consistent rendering
 */

import type { IFontService, HtmlToImageModule } from '../types'

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
