/**
 * Text outline fixer for printable exports
 * Fixes text-outline elements before export to ensure consistent rendering
 */

import type { ITextOutlineFixer } from '../types'

export class TextOutlineFixer implements ITextOutlineFixer {
  private readonly originalStyles = new Map<HTMLElement, Map<string, string>>()

  fixTextOutlineElements(element: HTMLElement): void {
    const textOutlineElements = element.querySelectorAll<HTMLElement>('.text-outline')
    textOutlineElements.forEach((el) => {
      // Store original styles for potential restoration
      const originalStyleMap = new Map<string, string>()
      const computedStyle = window.getComputedStyle(el)

      // Store all critical properties in CSS variables
      originalStyleMap.set('--line-height', el.style.getPropertyValue('--line-height'))
      originalStyleMap.set('--font-size', el.style.getPropertyValue('--font-size'))
      originalStyleMap.set('--letter-spacing', el.style.getPropertyValue('--letter-spacing'))
      originalStyleMap.set('--text-color', el.style.getPropertyValue('--text-color'))

      el.style.setProperty('--line-height', computedStyle.lineHeight)
      el.style.setProperty('--font-size', computedStyle.fontSize)
      el.style.setProperty('--letter-spacing', computedStyle.letterSpacing)
      // CRITICAL: Store the computed color to preserve it during export
      // html-to-image may not preserve Tailwind classes, so we force the color
      el.style.setProperty('--text-color', computedStyle.color)
      // Force reflow to ensure styles are applied
      void el.offsetHeight

      this.originalStyles.set(el, originalStyleMap)
    })
  }

  restoreTextOutlineElements(element: HTMLElement): void {
    const textOutlineElements = element.querySelectorAll<HTMLElement>('.text-outline')
    textOutlineElements.forEach((el) => {
      const originalStyleMap = this.originalStyles.get(el)
      if (originalStyleMap) {
        originalStyleMap.forEach((value, property) => {
          if (value) {
            el.style.setProperty(property, value)
          } else {
            el.style.removeProperty(property)
          }
        })
        this.originalStyles.delete(el)
      }
    })
  }
}
