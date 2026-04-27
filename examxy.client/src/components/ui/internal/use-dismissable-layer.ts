import { useEffect } from 'react'
import type { RefObject } from 'react'

interface UseDismissableLayerOptions {
  containerRef: RefObject<HTMLElement | null>
  enabled?: boolean
  onDismiss: () => void
  triggerRef?: RefObject<HTMLElement | null>
}

export function useDismissableLayer({
  containerRef,
  enabled = true,
  onDismiss,
  triggerRef,
}: UseDismissableLayerOptions) {
  useEffect(() => {
    if (!enabled) {
      return undefined
    }

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node | null
      if (!target) {
        return
      }

      if (containerRef.current?.contains(target)) {
        return
      }

      if (triggerRef?.current?.contains(target)) {
        return
      }

      onDismiss()
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onDismiss()
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [containerRef, enabled, onDismiss, triggerRef])
}
