import { FileText } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { CardShell } from '@/components/ui/card-shell'
import { Skeleton } from '@/components/ui/skeleton'
import {
  formatPaperExamDimensions,
  formatPaperExamUtcDate,
  getPaperExamStatusLabel,
  getPaperExamStatusTone,
  getTemplateMetrics,
  getVersionSummary,
} from '@/features/paper-exams/lib/paper-exam-display'
import type {
  PaperExamTemplate,
  PaperExamTemplateVersion,
  ValidatePaperExamTemplateVersionResult,
} from '@/types/paper-exam'

export function TemplateStatusBadge({ status }: { status: string }) {
  return (
    <Badge dot tone={getPaperExamStatusTone(status)} variant="soft">
      {getPaperExamStatusLabel(status)}
    </Badge>
  )
}

export function MetricPill({
  label,
  value,
}: {
  label: string
  value: string | number
}) {
  return (
    <div className="rounded-[calc(var(--radius-panel)-0.75rem)] border border-line/80 bg-surface px-4 py-3 shadow-[var(--shadow-subtle)]">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-ink">{value}</p>
    </div>
  )
}

export function PaperExamLoadingState() {
  return (
    <div className="space-y-6">
      <div className="border-b border-line/70 pb-5">
        <div className="space-y-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-10 w-full max-w-xl" />
          <Skeleton className="h-5 w-full max-w-3xl" />
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1fr_1.25fr]">
        {[0, 1, 2].map((item) => (
          <CardShell className="p-6" key={item} variant="subtle">
            <div className="space-y-4">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
          </CardShell>
        ))}
      </div>
    </div>
  )
}

export function TemplateCatalogCard({
  onSelect,
  showAdminMeta = true,
  template,
}: {
  onSelect: () => void
  showAdminMeta?: boolean
  template: PaperExamTemplate
}) {
  const metrics = getTemplateMetrics(template)

  return (
    <button
      className="w-full rounded-[var(--radius-panel)] border border-line/80 bg-surface px-4 py-4 text-left shadow-[var(--shadow-subtle)] transition hover:border-brand/30 hover:bg-panel"
      onClick={onSelect}
      type="button"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="primary" variant="soft">
              {template.code}
            </Badge>
            {showAdminMeta ? <TemplateStatusBadge status={template.status} /> : null}
          </div>
          <div className="space-y-1">
            <p className="text-lg font-semibold text-ink">{template.name}</p>
            <p className="line-clamp-2 text-sm leading-6 text-muted">
              {template.description || 'Chưa có mô tả.'}
            </p>
          </div>
          <div
            className={`grid gap-2 text-xs text-muted sm:grid-cols-2 ${
              showAdminMeta ? '' : 'hidden'
            }`}
          >
            <span className="rounded-full bg-panel px-2.5 py-1">
              {metrics.versionCount} phiên bản
            </span>
            <span className="rounded-full bg-panel px-2.5 py-1">
              {metrics.publishedVersionCount} đã xuất bản
            </span>
            <span className="rounded-full bg-panel px-2.5 py-1">
              {formatPaperExamDimensions(template)}
            </span>
            <span className="rounded-full bg-panel px-2.5 py-1">
              {template.markerScheme}
            </span>
          </div>
        </div>
      </div>
    </button>
  )
}

export function VersionStatusCard({ version }: { version: PaperExamTemplateVersion }) {
  const summary = getVersionSummary(version)

  return (
    <div className="rounded-[var(--radius-panel)] border border-brand/20 bg-brand-soft/20 p-4 shadow-[var(--shadow-panel)]">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-semibold text-ink">
              Phiên bản {version.versionNumber}
            </p>
            <TemplateStatusBadge status={version.status} />
          </div>
          <p className="mt-1 text-sm text-muted">
            Hash cấu hình: {version.geometryConfigHash || 'Chưa tính'}
          </p>
        </div>
        <Badge tone="neutral" variant="outline">
          Xuất bản {formatPaperExamUtcDate(version.publishedAtUtc)}
        </Badge>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <MetricPill label="Tệp" value={summary.assetCount} />
        <MetricPill label="Bắt buộc" value={summary.requiredAssetCount} />
        <MetricPill label="Siêu dữ liệu" value={summary.metadataFieldCount} />
      </div>
    </div>
  )
}

export function TemplatePreviewSummary({
  template,
  templateImageHash,
  version,
}: {
  template: PaperExamTemplate
  templateImageHash: string
  version: PaperExamTemplateVersion
}) {
  return (
    <div className="space-y-4 rounded-[var(--radius-panel)] border border-line/80 bg-panel p-4 shadow-[var(--shadow-subtle)]">
      <div className="flex items-center gap-2">
        <FileText className="size-4 text-brand-strong" />
        <p className="text-sm font-semibold text-ink">Xem trước cấu hình</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <MetricPill label="Khổ giấy" value={template.paperSize} />
        <MetricPill label="Kích thước" value={formatPaperExamDimensions(template)} />
        <MetricPill label="Số câu" value={version.questionCount} />
        <MetricPill label="Số lựa chọn" value={version.optionsPerQuestion} />
        <MetricPill label="Ảnh mẫu" value={templateImageHash || 'Chưa tải lên'} />
        <MetricPill label="Sơ đồ điểm chuẩn" value={template.markerScheme} />
      </div>
    </div>
  )
}

export function ValidationSummary({
  result,
}: {
  result: ValidatePaperExamTemplateVersionResult
}) {
  return (
    <div
      className={`rounded-[var(--radius-panel)] border p-4 shadow-[var(--shadow-subtle)] ${
        result.isValid
          ? 'border-success/30 bg-success-soft/40'
          : 'border-danger/30 bg-danger-soft/30'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-ink">
            Kết quả kiểm tra: {result.isValid ? 'Hợp lệ' : 'Không hợp lệ'}
          </p>
          <p className="mt-2 text-sm text-muted">
            Hash cấu hình: {result.geometryConfigHash || 'Chưa tính'}
          </p>
        </div>
        <TemplateStatusBadge status={result.isValid ? 'Valid' : 'Invalid'} />
      </div>

      {result.errors.length > 0 ? (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-semibold text-danger">Lỗi</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-danger">
            {result.errors.map((errorItem) => (
              <li key={errorItem}>{errorItem}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {result.warnings.length > 0 ? (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-semibold text-ink">Cảnh báo</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
            {result.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
