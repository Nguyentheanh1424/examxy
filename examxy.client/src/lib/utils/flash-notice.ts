import type { FlashNotice } from '@/types/ui'

const FLASH_NOTICE_KEY = 'examxy.flash-notice'

export function writeFlashNotice(notice: FlashNotice) {
  try {
    sessionStorage.setItem(FLASH_NOTICE_KEY, JSON.stringify(notice))
  } catch {
    // Ignore storage errors so auth flows do not fail on non-critical UX state.
  }
}

export function consumeFlashNotice() {
  try {
    const rawValue = sessionStorage.getItem(FLASH_NOTICE_KEY)

    if (!rawValue) {
      return null
    }

    sessionStorage.removeItem(FLASH_NOTICE_KEY)
    return JSON.parse(rawValue) as FlashNotice
  } catch {
    return null
  }
}
