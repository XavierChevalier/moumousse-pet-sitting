/**
 * Type definitions for printables
 */

export interface SegmentedControlChangeEvent extends CustomEvent {
  detail: {
    value: string
    controlId: string
  }
}

export type ExportMode = 'with-overlay' | 'without-overlay'
