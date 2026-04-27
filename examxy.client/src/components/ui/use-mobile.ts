import { useMediaQuery } from '@/components/ui/internal/use-media-query'

export function useIsMobile() {
  return useMediaQuery('(max-width: 767px)')
}
