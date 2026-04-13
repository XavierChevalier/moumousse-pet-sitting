import { describe, expect, it } from 'vitest'
import { buildLightboxItems } from './buildLightboxItems'

describe('buildLightboxItems', () => {
  it('uses optimized thumbnail sources instead of raw asset sources', () => {
    const items = buildLightboxItems({
      images: [
        {
          img: { src: '/raw/bene.jpeg', width: 3024, height: 4032, format: 'jpeg' },
          title: 'Bene',
          subtitle: 'Portrait',
        },
      ],
      lightboxFullSrcs: ['/optimized/bene-lightbox.webp'],
      lightboxThumbSrcs: ['/optimized/bene-thumb.webp'],
      cardLqipSrcs: ['/optimized/bene-lqip.webp'],
    })

    expect(items).toEqual([
      {
        fullSrc: '/optimized/bene-lightbox.webp',
        posterSrc: '/optimized/bene-lqip.webp',
        thumbSrc: '/optimized/bene-thumb.webp',
        intrinsicWidth: 3024,
        intrinsicHeight: 4032,
        title: 'Bene',
        subtitle: 'Portrait',
      },
    ])
  })
})
