/**
 * Overlay manager for printable exports
 * Manages overlay (crop marks) visibility during export
 */

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
