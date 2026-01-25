/**
 * Notification service for printable exports
 * Provides user feedback for export operations
 */

import type { INotificationService } from '../types'

export class NotificationService implements INotificationService {
  showError(message: string, details?: string): void {
    const notification = document.createElement('div')
    notification.className = 'export-notification export-notification-error'
    notification.style.cssText =
      'position: fixed; bottom: 20px; right: 20px; background: rgba(239, 68, 68, 0.9); color: white; padding: 16px 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10001; max-width: 400px; animation: slideIn 0.3s ease-out; backdrop-filter: blur(8px);'
    notification.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 4px;">${this.escapeHtml(message)}</div>
      ${details ? `<div style="font-size: 0.875rem; opacity: 0.9;">${this.escapeHtml(details)}</div>` : ''}
    `

    document.body.appendChild(notification)

    // Auto-remove after 5 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out'
      setTimeout(() => notification.remove(), 300)
    }, 5000)
  }

  showSuccess(message: string): void {
    const notification = document.createElement('div')
    notification.className = 'export-notification export-notification-success'
    notification.style.cssText =
      'position: fixed; bottom: 20px; right: 20px; background: rgba(16, 185, 129, 0.9); color: white; padding: 16px 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10001; max-width: 400px; animation: slideIn 0.3s ease-out; backdrop-filter: blur(8px);'
    notification.textContent = message

    document.body.appendChild(notification)

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out'
      setTimeout(() => notification.remove(), 300)
    }, 3000)
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }
}
