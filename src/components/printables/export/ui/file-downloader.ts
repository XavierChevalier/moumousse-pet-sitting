/**
 * File downloader for printable exports
 * Handles file downloads from data URLs
 */

import type { PrintableDimensions } from '../../../core/printables/dimensions'

export class FileDownloader {
  download(dataUrl: string, filename: string): void {
    const link = document.createElement('a')
    link.download = filename
    link.href = dataUrl
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    // Clean up after the next frame to ensure the click was processed
    requestAnimationFrame(() => {
      if (link.parentNode === document.body) {
        document.body.removeChild(link)
      }
    })
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
