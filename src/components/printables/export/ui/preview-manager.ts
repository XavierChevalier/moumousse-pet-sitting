/**
 * Preview manager for printable exports
 * Manages preview UI for exported images
 */

import type { PreviewStyles } from '../types'

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
