import type { ImageMetadata } from 'astro'

export interface LightboxItem {
  fullSrc: string
  /** Same as grid LQIP (`cardLqipSrcs`): slide poster + blurred thumb placeholder until `thumbSrc` / `fullSrc` load. */
  posterSrc: string
  thumbSrc: string
  intrinsicWidth: number
  intrinsicHeight: number
  title: string
  subtitle: string
}

interface GalleryImageInput {
  img: ImageMetadata & { src: string }
  title: string
  subtitle?: string
}

interface BuildLightboxItemsOptions {
  images: GalleryImageInput[]
  lightboxFullSrcs: string[]
  lightboxThumbSrcs: string[]
  cardLqipSrcs: string[]
}

export function buildLightboxItems({
  images,
  lightboxFullSrcs,
  lightboxThumbSrcs,
  cardLqipSrcs,
}: BuildLightboxItemsOptions): LightboxItem[] {
  return images.map(({ img, title, subtitle }, idx) => ({
    fullSrc: lightboxFullSrcs[idx]!,
    posterSrc: cardLqipSrcs[idx]!,
    thumbSrc: lightboxThumbSrcs[idx]!,
    intrinsicWidth: img.width,
    intrinsicHeight: img.height,
    title,
    subtitle: subtitle ?? '',
  }))
}
