import { describe, expect, it } from 'vitest'

import {
  formatPaperExamDimensions,
  getPaperExamStatusLabel,
  getTemplateMetrics,
  templateMatchesSearch,
} from '@/features/paper-exams/lib/paper-exam-display'
import type { PaperExamTemplate } from '@/types/paper-exam'

function makeTemplate(overrides?: Partial<PaperExamTemplate>): PaperExamTemplate {
  return {
    code: 'OMR-A4',
    createdAtUtc: '2026-01-01T00:00:00Z',
    description: 'Default OMR template',
    hasHandwrittenRegions: false,
    hasQuizIdField: true,
    hasStudentIdField: true,
    id: 'template-1',
    markerScheme: 'custom',
    name: 'OMR A4',
    outputHeight: 2000,
    outputWidth: 1400,
    paperSize: 'A4',
    status: 'Active',
    versions: [
      {
        absThreshold: 0.7,
        assets: [
          {
            assetType: 'MarkerLayout',
            contentHash: 'asset-hash',
            id: 'asset-1',
            isRequired: true,
            jsonContent: '{}',
            storagePath: 'paper-exam/asset.json',
          },
        ],
        createdAtUtc: '2026-01-01T00:00:00Z',
        geometryConfigHash: 'geom-1',
        id: 'version-1',
        metadataFields: [],
        minClientAppVersion: null,
        optionsPerQuestion: 4,
        payloadSchemaVersion: '1.0',
        questionCount: 20,
        relThreshold: 0.25,
        schemaVersion: '1.0',
        scoringMethod: 'annulus_patch_darkness',
        scoringParamsJson: '{}',
        status: 'Published',
        templateId: 'template-1',
        updatedAtUtc: '2026-01-01T00:00:00Z',
        versionNumber: 1,
        publishedAtUtc: '2026-01-02T00:00:00Z',
      },
    ],
    updatedAtUtc: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('paper exam display helpers', () => {
  it('maps API status values to Vietnamese labels without changing payloads', () => {
    expect(getPaperExamStatusLabel('Draft')).toBe('Bản nháp')
    expect(getPaperExamStatusLabel('Published')).toBe('Đã xuất bản')
    expect(getPaperExamStatusLabel('UnknownStatus')).toBe('UnknownStatus')
  })

  it('derives template dimensions and metrics from real template shape', () => {
    const template = makeTemplate()

    expect(formatPaperExamDimensions(template)).toBe('1400 x 2000')
    expect(getTemplateMetrics(template)).toMatchObject({
      assetCount: 1,
      publishedVersionCount: 1,
      versionCount: 1,
    })
  })

  it('searches across template code, name, description, and status', () => {
    const template = makeTemplate({ description: 'Phiếu kiểm tra cuối kỳ' })

    expect(templateMatchesSearch(template, 'cuối kỳ')).toBe(true)
    expect(templateMatchesSearch(template, 'published')).toBe(false)
  })
})
