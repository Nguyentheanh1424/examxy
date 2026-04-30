import type { ReactNode } from "react";

import { CardShell } from "@/components/ui/card-shell";
import { loginAssetSlots } from "@/features/auth/lib/login-asset-slots";

export interface AuthEdgeLayoutProps {
  children: ReactNode;
}

export function AuthEdgeLayout({ children }: AuthEdgeLayoutProps) {
  return (
    <div
      className="flex min-h-screen w-full xl:h-screen xl:overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, var(--color-auth-backdrop) 0%, var(--color-auth-backdrop-strong) 100%)",
      }}
    >
      <div className="flex w-full flex-col xl:h-full xl:flex-row">
        <section className="relative hidden shrink-0 overflow-hidden xl:block xl:h-full xl:max-w-[46vw]">
          <img
            alt={loginAssetSlots.hero.alt}
            className="relative z-10 h-full w-auto max-w-[46vw] object-contain object-center opacity-95 mix-blend-screen"
            src={loginAssetSlots.hero.src}
          />
          <div
            className="absolute inset-0 z-20 pointer-events-none"
            style={{
              background:
                "linear-gradient(180deg, color-mix(in oklab, var(--color-auth-backdrop) 82%, transparent) 0%, transparent 38%, color-mix(in oklab, var(--color-auth-backdrop-strong) 90%, transparent) 100%)",
            }}
          />
          <div
            className="absolute inset-y-0 right-0 z-30 hidden w-40 pointer-events-none xl:block"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, color-mix(in oklab, var(--color-auth-backdrop-strong) 76%, transparent) 100%)",
            }}
          />
          <div
            className="absolute -bottom-14 left-1/2 z-0 hidden size-64 -translate-x-1/2 rounded-full blur-3xl xl:block"
            style={{ backgroundColor: "var(--color-auth-hero-glow)" }}
          />
        </section>

        <section
          className="relative flex w-full min-w-0 flex-1 overflow-hidden bg-surface text-ink xl:h-full xl:min-w-[32rem] xl:overflow-y-auto"
          style={{
            background:
              "linear-gradient(135deg, var(--color-surface) 0%, color-mix(in oklab, var(--color-surface-alt) 42%, var(--color-surface)) 100%)",
          }}
        >
          <CardShell
            className="relative z-10 flex min-h-full w-full flex-col justify-center rounded-none border-none bg-transparent py-8 shadow-none sm:py-9 xl:p-12"
            style={{
              color: "var(--color-ink)",
            }}
          >
            <div className="mx-auto flex w-full max-w-md flex-col justify-center gap-5 px-6 py-10 sm:px-8 xl:px-0">
              {children}
            </div>
          </CardShell>
        </section>
      </div>
    </div>
  );
}
