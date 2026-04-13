import type { ImageMetadata } from 'astro'
import { getImage } from 'astro:assets'

export type GalleryImageSrcsInput = { img: ImageMetadata }

export type GalleryResolvedSrcs = {
  lightboxFullSrcs: string[]
  lightboxThumbSrcs: string[]
  cardLqipSrcs: string[]
}

type GetImageOpts = Omit<Parameters<typeof getImage>[0], 'src'>

const SPECS = {
  // Full-size lightbox image (`GalleryLightbox`); same URL prefetched from grid items (`data-lightbox-full-src`, `GalleryRows` inline script).
  lightboxFullSrcs: { width: 1920, format: 'webp', quality: 80 },
  // Bottom thumbnail strip in the lightbox (`GalleryLightbox` `[data-lightbox-thumbs]`).
  lightboxThumbSrcs: { width: 128, height: 128, format: 'webp', quality: 70 },
  // Grid LQIP (`GalleryRow`) and lightbox poster while full image loads (`GalleryLightbox`); one asset, two consumers.
  cardLqipSrcs: { width: 16, format: 'webp', quality: 10 },
} satisfies Record<keyof GalleryResolvedSrcs, GetImageOpts>

const KEYS = Object.keys(SPECS) as (keyof GalleryResolvedSrcs)[]

export async function buildGalleryImageSrcs(
  images: GalleryImageSrcsInput[]
): Promise<GalleryResolvedSrcs> {
  const batches = await Promise.all(
    KEYS.map((key) => Promise.all(images.map(({ img }) => getImage({ src: img, ...SPECS[key] }))))
  )

  return Object.fromEntries(
    KEYS.map((key, i) => [key, batches[i]!.map((r) => r.src)])
  ) as GalleryResolvedSrcs
}
