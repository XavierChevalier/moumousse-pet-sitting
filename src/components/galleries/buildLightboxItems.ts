import type { ImageMetadata } from 'astro'

export interface LightboxItem {
  src: string
  thumbSrc: string
  intrinsicWidth: number
  intrinsicHeight: number
  title: string
  subtitle: string
  alt: string
}

interface GalleryImageInput {
  img: ImageMetadata & { src: string }
  title: string
  subtitle?: string
}

interface BuildLightboxItemsOptions {
  images: GalleryImageInput[]
  highResSources: string[]
  thumbSources: string[]
  imageAltSuffix: string
}

export function buildLightboxItems({
  images,
  highResSources,
  thumbSources,
  imageAltSuffix,
}: BuildLightboxItemsOptions): LightboxItem[] {
  return images.map(({ img, title, subtitle }, idx) => ({
    src: highResSources[idx]!,
    thumbSrc: thumbSources[idx]!,
    intrinsicWidth: img.width,
    intrinsicHeight: img.height,
    title,
    subtitle: subtitle ?? '',
    alt: `${title} - ${imageAltSuffix}`,
  }))
}
