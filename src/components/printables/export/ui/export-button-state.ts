/**
 * Export button state manager
 * Manages button state during export operations
 */

import type { ButtonState } from '../types'

export class ExportButtonState {
  saveState(button: HTMLButtonElement): ButtonState {
    return {
      originalText: button.innerHTML,
      originalDisabled: button.disabled,
    }
  }

  setLoading(button: HTMLButtonElement): void {
    button.disabled = true
    button.innerHTML = 'Export en cours...'
  }

  restoreState(button: HTMLButtonElement, state: ButtonState): void {
    button.disabled = state.originalDisabled
    button.innerHTML = state.originalText
  }
}
