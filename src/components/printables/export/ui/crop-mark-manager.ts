/**
 * Crop mark manager for printable exports
 * Manages crop mark visibility during export
 */

export class CropMarkManager {
  private visibilityStates = new Map<HTMLElement, boolean>()

  hideCropMarks(element: HTMLElement): void {
    const cropMarkImage = element.querySelector<HTMLImageElement>('.overlay-image')
    if (cropMarkImage) {
      this.visibilityStates.set(cropMarkImage, cropMarkImage.style.display !== 'none')
      cropMarkImage.style.display = 'none'
    }
  }

  showCropMarks(element: HTMLElement): void {
    const cropMarkImage = element.querySelector<HTMLImageElement>('.overlay-image')
    if (cropMarkImage) {
      cropMarkImage.style.display = ''
    }
  }

  setCropMarkVisibility(element: HTMLElement, visible: boolean): void {
    if (visible) {
      this.showCropMarks(element)
    } else {
      this.hideCropMarks(element)
    }
  }

  restoreCropMarkVisibility(element: HTMLElement): void {
    const cropMarkImage = element.querySelector<HTMLImageElement>('.overlay-image')
    if (cropMarkImage) {
      const wasVisible = this.visibilityStates.get(cropMarkImage) ?? true
      cropMarkImage.style.display = wasVisible ? '' : 'none'
      this.visibilityStates.delete(cropMarkImage)
    }
  }
}
