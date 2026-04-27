import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export function HoverCard({ children }: { children: ReactNode }) {
  return <Tooltip>{children}</Tooltip>
}

export function HoverCardTrigger(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <TooltipTrigger {...props} />
}

export function HoverCardContent(props: HTMLAttributes<HTMLDivElement>) {
  return <TooltipContent {...props} />
}
