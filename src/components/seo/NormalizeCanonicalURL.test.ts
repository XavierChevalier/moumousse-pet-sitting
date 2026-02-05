import { describe, expect, it } from 'vitest'
import { normalizeCanonicalURL } from './NormalizeCanonicalURL'

const baseURL = 'https://example.com'

describe('normalizeCanonicalURL', () => {
  it('returns base URL when pathname is undefined', () => {
    const result = normalizeCanonicalURL({ baseURL, pathname: undefined })

    expect(result).toBe(`${baseURL}/`)
  })

  it('returns base URL when pathname is empty', () => {
    const result = normalizeCanonicalURL({ baseURL, pathname: '' })

    expect(result).toBe(`${baseURL}/`)
  })

  it('normalizes pathname without leading slash', () => {
    const result = normalizeCanonicalURL({ baseURL, pathname: 'about' })

    expect(result).toBe(`${baseURL}/about`)
  })

  it('keeps pathname with leading slash as-is', () => {
    const result = normalizeCanonicalURL({ baseURL, pathname: '/contact' })

    expect(result).toBe(`${baseURL}/contact`)
  })

  it('removes query parameters and hash for canonical URL', () => {
    const result = normalizeCanonicalURL({
      baseURL,
      pathname: '/search?q=cat#section',
    })

    expect(result).toBe(`${baseURL}/search`)
  })
})
