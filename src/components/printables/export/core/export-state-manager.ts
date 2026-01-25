/**
 * Export state manager for printable exports
 * Manages global export state (e.g., exporting class on document)
 */

export class ExportStateManager {
  private isExporting = false

  setExporting(value: boolean): void {
    if (value === this.isExporting) return

    this.isExporting = value
    if (value) {
      document.documentElement.classList.add('exporting')
    } else {
      document.documentElement.classList.remove('exporting')
    }
  }

  getIsExporting(): boolean {
    return this.isExporting
  }
}
