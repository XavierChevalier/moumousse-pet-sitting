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
      highResSources: ['/optimized/bene-lightbox.webp'],
      thumbSources: ['/optimized/bene-thumb.webp'],
      imageAltSuffix: 'Animal gardé par Moumousse Pet Sitting à Pélussin et alentours',
    })

    expect(items).toEqual([
      {
        src: '/optimized/bene-lightbox.webp',
        thumbSrc: '/optimized/bene-thumb.webp',
        intrinsicWidth: 3024,
        intrinsicHeight: 4032,
        title: 'Bene',
        subtitle: 'Portrait',
        alt: 'Bene - Animal gardé par Moumousse Pet Sitting à Pélussin et alentours',
      },
    ])
  })
})
