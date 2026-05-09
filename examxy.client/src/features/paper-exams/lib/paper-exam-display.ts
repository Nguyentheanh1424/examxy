import type {
  PaperExamTemplate,
  PaperExamTemplateVersion,
} from '@/types/paper-exam'

export function formatPaperExamUtcDate(value: string | null) {
  if (!value) return 'Chưa xuất bản'

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function getPaperExamStatusLabel(status: string) {
  const labels: Record<string, string> = {
    Active: 'Đang hoạt động',
    Archived: 'Đã lưu trữ',
    Draft: 'Bản nháp',
    Invalid: 'Không hợp lệ',
    Published: 'Đã xuất bản',
    Valid: 'Hợp lệ',
  }

  return labels[status] ?? status
}

export function getPaperExamStatusTone(status: string) {
  const normalizedStatus = status.toLowerCase()

  if (normalizedStatus.includes('publish') || normalizedStatus.includes('active')) {
    return 'success'
  }

  if (normalizedStatus.includes('draft')) {
    return 'warning'
  }

  if (normalizedStatus.includes('invalid') || normalizedStatus.includes('error')) {
    return 'error'
  }

  if (normalizedStatus.includes('archive')) {
    return 'neutral'
  }

  return 'info'
}

export function getTemplateMetrics(template: PaperExamTemplate) {
  const publishedVersionCount = template.versions.filter(
    (version) => version.status === 'Published',
  ).length
  const draftVersionCount = template.versions.filter(
    (version) => version.status !== 'Published',
  ).length

  return {
    assetCount: template.versions.reduce(
      (total, version) => total + version.assets.length,
      0,
    ),
    draftVersionCount,
    metadataFieldCount: template.versions.reduce(
      (total, version) => total + version.metadataFields.length,
      0,
    ),
    publishedVersionCount,
    versionCount: template.versions.length,
  }
}

export function getVersionSummary(version: PaperExamTemplateVersion) {
  const requiredAssetCount = version.assets.filter((asset) => asset.isRequired).length

  return {
    assetCount: version.assets.length,
    metadataFieldCount: version.metadataFields.length,
    requiredAssetCount,
  }
}

export function formatPaperExamDimensions(template: PaperExamTemplate) {
  if (!template.outputWidth || !template.outputHeight) {
    return 'Chưa đặt kích thước'
  }

  return `${template.outputWidth} x ${template.outputHeight}`
}

export function templateMatchesSearch(template: PaperExamTemplate, query: string) {
  const normalizedQuery = query.trim().toLowerCase()

  if (!normalizedQuery) {
    return true
  }

  return [
    template.code,
    template.name,
    template.description,
    template.status,
  ].some((value) => value.toLowerCase().includes(normalizedQuery))
}
