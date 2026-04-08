import { CardShell } from '@/components/ui/card-shell'

export function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <CardShell className="p-6 sm:p-8">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-strong">
            Admin dashboard
          </p>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-4xl">
            Internal administration entry point
          </h1>
          <p className="max-w-3xl text-base leading-7 text-muted">
            Admin accounts are provisioned through the internal API and this
            dashboard is intentionally lightweight for now. The role-based redirect
            is already reserved so future admin tooling can land here without
            changing auth flow again.
          </p>
        </div>
      </CardShell>
    </div>
  )
}
