import type { ReactNode } from 'react'
import type React from 'react'

import { CardShell } from '@/components/ui/card-shell'
import { loginAssetSlots } from '@/features/auth/lib/login-asset-slots'

export interface AuthEdgeLayoutProps {
  children: ReactNode
}

export function AuthEdgeLayout({ children }: AuthEdgeLayoutProps) {
  return (
    <div className="flex min-h-screen w-full lg:h-screen lg:overflow-hidden bg-[#0a1536]">
      <div className="flex w-full flex-col lg:flex-row">
        <section className="relative w-full shrink-0 overflow-hidden bg-[#0a1536] lg:h-full lg:w-auto lg:basis-auto">
          <img
            alt={loginAssetSlots.hero.alt}
            className="relative z-10 h-full w-full object-cover object-top opacity-85 mix-blend-screen lg:w-auto lg:object-contain lg:object-center"
            src={loginAssetSlots.hero.src}
          />
          <div className="absolute inset-0 z-20 bg-gradient-to-b from-[#0a1536]/80 via-transparent to-[#0a1536]/90 pointer-events-none" />
          
          {/* Vệt mờ dưới cùng cho mobile */}
          <div className="absolute inset-x-0 bottom-0 z-30 h-10 bg-gradient-to-b from-transparent via-[#0a1536]/60 to-[#0a1536] pointer-events-none lg:hidden" />

          {/* Vệt mờ cạnh phải cho desktop */}
          <div className="absolute inset-y-0 right-0 z-30 hidden w-48 bg-gradient-to-r from-transparent via-[#0a1536]/60 to-[#0a1536] pointer-events-none lg:block" />
        </section>

        <section 
          className="flex w-full flex-1 bg-gradient-to-r from-[#0a1536] to-[#162758] text-white lg:h-full lg:overflow-y-auto"
          style={{
            '--ui-ink': 'oklch(0.98 0 0)',
            '--ui-muted': 'oklch(0.75 0.02 260)',
            '--ui-surface': 'oklch(0.22 0.05 260)',
            '--ui-surface-alt': 'oklch(0.28 0.05 260)',
            '--ui-line': 'oklch(0.4 0.05 260)',
            '--ui-brand-soft': 'oklch(0.25 0.08 245)',
            '--ui-success-soft': 'oklch(0.25 0.05 150)',
            '--ui-warning-soft': 'oklch(0.25 0.08 85)',
            '--ui-danger-soft': 'oklch(0.25 0.08 30)',
          } as React.CSSProperties}
        >
          <CardShell className="flex w-full min-h-full flex-col justify-center rounded-none border-none bg-transparent p-6 shadow-none sm:p-8 lg:p-10">
            <div className="mx-auto flex w-full max-w-md flex-col justify-center gap-4 sm:gap-5">
              {children}
            </div>
          </CardShell>
        </section>
      </div>
    </div>
  )
}
