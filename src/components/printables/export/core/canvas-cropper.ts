/**
 * Canvas cropper for printable exports
 * Crops images using canvas API
 */

import { EXPORT_TIMEOUT_MS } from '../constants'

export class CanvasCropper {
  async cropImage(
    imageDataUrl: string,
    sourceX: number,
    sourceY: number,
    sourceWidth: number,
    sourceHeight: number,
    targetWidth: number,
    targetHeight: number
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      let isResolved = false
      let timeoutId: ReturnType<typeof setTimeout> | null = null

      const cleanup = () => {
        if (timeoutId !== null) {
          clearTimeout(timeoutId)
          timeoutId = null
        }
      }

      const safeResolve = (value: string) => {
        if (!isResolved) {
          isResolved = true
          cleanup()
          resolve(value)
        }
      }

      const safeReject = (error: Error) => {
        if (!isResolved) {
          isResolved = true
          cleanup()
          reject(error)
        }
      }

      timeoutId = setTimeout(() => {
        safeReject(new Error('Image loading timeout'))
      }, EXPORT_TIMEOUT_MS)

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = targetWidth
          canvas.height = targetHeight
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            safeReject(new Error('Failed to get canvas context'))
            return
          }

          ctx.drawImage(
            img,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            0,
            0,
            targetWidth,
            targetHeight
          )

          safeResolve(canvas.toDataURL('image/png'))
        } catch (error) {
          safeReject(error instanceof Error ? error : new Error('Canvas cropping failed'))
        }
      }

      img.onerror = () => {
        safeReject(new Error('Failed to load image for cropping'))
      }

      img.src = imageDataUrl
    })
  }
}
