/**
 * Panning controller for printables canvas
 * Handles space+drag and middle mouse button panning
 */

export function createPanningController(container: HTMLElement): () => void {
  let isPanning = false
  let isSpacePressed = false
  let startX = 0
  let startY = 0
  let scrollLeft = 0
  let scrollTop = 0

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Space' && !(e.target as HTMLElement).matches('input, textarea')) {
      e.preventDefault()
      isSpacePressed = true
      container.style.cursor = 'grab'
    }
  }

  const handleKeyUp = (e: KeyboardEvent) => {
    if (e.code === 'Space') {
      isSpacePressed = false
      if (!isPanning) {
        container.style.cursor = ''
      }
    }
  }

  const handleMouseDown = (e: MouseEvent) => {
    // Space + click or middle mouse button
    if (isSpacePressed || e.button === 1) {
      e.preventDefault()
      isPanning = true
      container.style.cursor = 'grabbing'
      const rect = container.getBoundingClientRect()
      startX = e.clientX - rect.left
      startY = e.clientY - rect.top
      scrollLeft = container.scrollLeft
      scrollTop = container.scrollTop
    }
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isPanning) return
    e.preventDefault()
    const rect = container.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const walkX = x - startX
    const walkY = y - startY
    container.scrollLeft = scrollLeft - walkX
    container.scrollTop = scrollTop - walkY
  }

  const updateCursor = () => {
    if (isSpacePressed) {
      container.style.cursor = 'grab'
      return
    }
    container.style.cursor = ''
  }

  const handleMouseUp = () => {
    if (!isPanning) return

    isPanning = false
    updateCursor()
  }

  const handleMouseLeave = () => {
    if (!isPanning) return

    isPanning = false
    updateCursor()
  }

  const handleContextMenu = (e: MouseEvent) => {
    if (e.button === 1) {
      e.preventDefault()
    }
  }

  document.addEventListener('keydown', handleKeyDown)
  document.addEventListener('keyup', handleKeyUp)
  container.addEventListener('mousedown', handleMouseDown)
  container.addEventListener('mousemove', handleMouseMove)
  container.addEventListener('mouseup', handleMouseUp)
  container.addEventListener('mouseleave', handleMouseLeave)
  container.addEventListener('contextmenu', handleContextMenu)

  return () => {
    document.removeEventListener('keydown', handleKeyDown)
    document.removeEventListener('keyup', handleKeyUp)
    container.removeEventListener('mousedown', handleMouseDown)
    container.removeEventListener('mousemove', handleMouseMove)
    container.removeEventListener('mouseup', handleMouseUp)
    container.removeEventListener('mouseleave', handleMouseLeave)
    container.removeEventListener('contextmenu', handleContextMenu)
  }
}
