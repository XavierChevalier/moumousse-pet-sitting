/**
 * Content centering behavior for printables
 */

import { findVisiblePrintableCard } from './dom-queries'

export function centerPrintableCardInViewport(container: HTMLElement): void {
  const visibleCard = findVisiblePrintableCard()
  if (!visibleCard) return

  const containerRect = container.getBoundingClientRect()
  const cardRect = visibleCard.getBoundingClientRect()

  // Calculate scroll position to center the card
  const cardCenterX = cardRect.left + cardRect.width / 2
  const cardCenterY = cardRect.top + cardRect.height / 2
  const containerCenterX = containerRect.left + containerRect.width / 2
  const containerCenterY = containerRect.top + containerRect.height / 2

  const scrollX = container.scrollLeft + (cardCenterX - containerCenterX)
  const scrollY = container.scrollTop + (cardCenterY - containerCenterY)

  container.scrollLeft = scrollX
  container.scrollTop = scrollY
}

function waitForFrames(callback: () => void, frames: number): void {
  if (frames <= 0) {
    callback()
    return
  }

  requestAnimationFrame(() => {
    waitForFrames(callback, frames - 1)
  })
}

export function setupContentCentering(container: HTMLElement): void {
  const center = () => {
    centerPrintableCardInViewport(container)
    // Also center after a few frames to ensure all content is loaded
    // ~300ms ≈ 5 frames at 60fps
    waitForFrames(() => centerPrintableCardInViewport(container), 5)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      requestAnimationFrame(center)
    })
    return
  }

  requestAnimationFrame(center)
}
