import type { ReactNode } from 'react'

import { CardShell } from '@/components/ui/card-shell'
import { loginAssetSlots } from '@/features/auth/lib/login-asset-slots'

export interface AuthEdgeLayoutProps {
  children: ReactNode
}

export function AuthEdgeLayout({ children }: AuthEdgeLayoutProps) {
  return (
    <div
      className="flex min-h-screen w-full"
      style={{
        background:
          'linear-gradient(135deg, var(--color-auth-backdrop) 0%, var(--color-auth-backdrop-strong) 100%)',
      }}
    >
      <div className="flex w-full flex-col lg:min-h-screen lg:flex-row">
        <section className="relative w-full shrink-0 overflow-hidden lg:w-[48%]">
          <img
            alt={loginAssetSlots.hero.alt}
            className="relative z-10 h-full w-full object-cover object-top opacity-90 mix-blend-screen"
            src={loginAssetSlots.hero.src}
          />
          <div
            className="absolute inset-0 z-20 pointer-events-none"
            style={{
              background:
                'linear-gradient(180deg, color-mix(in oklab, var(--color-auth-backdrop) 82%, transparent) 0%, transparent 38%, color-mix(in oklab, var(--color-auth-backdrop-strong) 90%, transparent) 100%)',
            }}
          />
          <div
            className="absolute inset-y-0 right-0 z-30 hidden w-40 pointer-events-none lg:block"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, color-mix(in oklab, var(--color-auth-backdrop-strong) 76%, transparent) 100%)',
            }}
          />
          <div
            className="absolute -bottom-14 left-1/2 z-0 hidden size-64 -translate-x-1/2 rounded-full blur-3xl lg:block"
            style={{ backgroundColor: 'var(--color-auth-hero-glow)' }}
          />
        </section>

        <section
          className="flex w-full flex-1 text-white lg:min-h-screen lg:overflow-y-auto"
          style={{
            background:
              'linear-gradient(135deg, color-mix(in oklab, var(--color-auth-backdrop) 78%, var(--color-auth-backdrop-strong) 22%) 0%, var(--color-auth-backdrop-strong) 100%)',
          }}
        >
          <CardShell
            className="flex w-full min-h-full flex-col justify-center rounded-none border-none bg-transparent p-6 shadow-none sm:p-8 lg:p-12"
            style={{
              color: 'var(--color-surface)',
            }}
          >
            <div className="mx-auto flex w-full max-w-md flex-col justify-center gap-4 sm:gap-5">
              {children}
            </div>
          </CardShell>
        </section>
      </div>
    </div>
  )
}
