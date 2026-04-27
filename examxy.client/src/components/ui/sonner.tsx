/* eslint-disable react-refresh/only-export-components */

import { X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Notice } from '@/components/ui/notice'
import { Portal } from '@/components/ui/internal/portal'

export interface ToastMessage {
  description?: string
  id?: string
  title: string
  tone?: 'info' | 'success' | 'warning' | 'error'
}

const TOAST_EVENT = 'examxy-ui-toast'

export function toast(message: ToastMessage) {
  window.dispatchEvent(new CustomEvent<ToastMessage>(TOAST_EVENT, { detail: message }))
}

export function Toaster() {
  const [messages, setMessages] = useState<ToastMessage[]>([])

  useEffect(() => {
    function handleToast(event: Event) {
      const customEvent = event as CustomEvent<ToastMessage>
      const message = customEvent.detail
      const id = message.id ?? `${Date.now()}-${Math.random()}`

      setMessages((current) => [...current, { ...message, id }])

      window.setTimeout(() => {
        setMessages((current) => current.filter((item) => item.id !== id))
      }, 3000)
    }

    window.addEventListener(TOAST_EVENT, handleToast)
    return () => {
      window.removeEventListener(TOAST_EVENT, handleToast)
    }
  }, [])

  if (messages.length === 0) {
    return null
  }

  return (
    <Portal>
      <div className="fixed bottom-4 right-4 z-[60] flex w-[min(92vw,24rem)] flex-col gap-3">
        {messages.map((message) => (
          <Notice
            actions={
              <Button
                className="ml-auto"
                onClick={() => {
                  setMessages((current) => current.filter((item) => item.id !== message.id))
                }}
                size="sm"
                variant="ghost"
              >
                <X className="size-4" />
              </Button>
            }
            key={message.id}
            tone={message.tone ?? 'info'}
            title={message.title}
          >
            {message.description ?? ''}
          </Notice>
        ))}
      </div>
    </Portal>
  )
}
