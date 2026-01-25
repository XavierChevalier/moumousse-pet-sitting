/**
 * Exporting flag for printable exports
 * Manages global exporting state (adds 'exporting' class to document)
 */

export class ExportingFlag {
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
