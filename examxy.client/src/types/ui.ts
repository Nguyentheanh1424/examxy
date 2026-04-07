export type NoticeTone = 'info' | 'success' | 'warning' | 'error'

export interface FlashNotice {
  tone: NoticeTone
  title?: string
  message: string
}
