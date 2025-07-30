export const useResponsive = () => {
  const breakpoints = {
    get sm() {
      return getComputedStyle(document.documentElement).getPropertyValue('--breakpoint-sm')
    },
    get md() {
      return getComputedStyle(document.documentElement).getPropertyValue('--breakpoint-md')
    },
    get lg() {
      return getComputedStyle(document.documentElement).getPropertyValue('--breakpoint-lg')
    },
    get xl() {
      return getComputedStyle(document.documentElement).getPropertyValue('--breakpoint-xl')
    },
    get '2xl'() {
      return getComputedStyle(document.documentElement).getPropertyValue('--breakpoint-2xl')
    },
  }

  const is = {
    get sm() {
      return window.matchMedia(`(min-width: ${breakpoints.sm})`).matches
    },
    get md() {
      return window.matchMedia(`(min-width: ${breakpoints.md})`).matches
    },
    get lg() {
      return window.matchMedia(`(min-width: ${breakpoints.lg})`).matches
    },
    get xl() {
      return window.matchMedia(`(min-width: ${breakpoints.xl})`).matches
    },
    get '2xl'() {
      return window.matchMedia(`(min-width: ${breakpoints['2xl']})`).matches
    },
  }

  // Helper to check if we're below a breakpoint (mobile-first)
  const isBelow = {
    get sm() {
      return !is.sm
    },
    get md() {
      return !is.md
    },
    get lg() {
      return !is.lg
    },
    get xl() {
      return !is.xl
    },
    get '2xl'() {
      return !is['2xl']
    },
  }

  return {
    breakpoints,
    is,
    isBelow,
  }
}
