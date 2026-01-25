/**
 * DOM queries and utilities for printable cards
 */

import type { PrintableDimensions } from '../../../core/printables/dimensions'

export function findVisiblePrintableCard(): HTMLElement | null {
  const containers = document.querySelectorAll('[data-face-container]')
  for (const container of containers) {
    if (!container.classList.contains('hidden')) {
      const cardId = container.getAttribute('data-face-container')
      if (cardId) {
        return document.getElementById(cardId)
      }
    }
  }
  return null
}

export function parsePrintableCardDimensions(element: HTMLElement): PrintableDimensions | null {
  const dimensionsStr = element.getAttribute('data-dimensions')
  if (!dimensionsStr) return null
  try {
    return JSON.parse(dimensionsStr) as PrintableDimensions
  } catch {
    return null
  }
}

export function waitForElementToAppear<T extends Element>(
  selector: string,
  timeout = 5000
): Promise<T | null> {
  return new Promise((resolve) => {
    const element = document.querySelector<T>(selector)
    if (element) {
      resolve(element)
      return
    }

    const observer = new MutationObserver(() => {
      const found = document.querySelector<T>(selector)
      if (found) {
        observer.disconnect()
        clearTimeout(timeoutId)
        resolve(found)
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    const timeoutId = setTimeout(() => {
      observer.disconnect()
      resolve(null)
    }, timeout)
  })
}

export function scheduleIdleTask(callback: () => void, timeout = 1000): void {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(callback, { timeout })
  } else {
    setTimeout(callback, 50)
  }
}
