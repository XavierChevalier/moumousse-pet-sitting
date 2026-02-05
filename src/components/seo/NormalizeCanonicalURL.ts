interface NormalizeCanonicalURLProps {
  baseURL: string
  pathname: string | undefined
}

export function normalizeCanonicalURL({ baseURL, pathname }: NormalizeCanonicalURLProps): string {
  const normalizedPathname =
    pathname && pathname.length > 0 ? (pathname.startsWith('/') ? pathname : `/${pathname}`) : '/'

  const url = new URL(normalizedPathname, baseURL)

  // For canonical URLs, we do not want query parameters or hash fragments.
  url.search = ''
  url.hash = ''

  return url.href
}
