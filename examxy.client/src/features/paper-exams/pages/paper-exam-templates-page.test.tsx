import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PaperExamTemplatesPage } from '@/features/paper-exams/pages/paper-exam-templates-page'

const { paperExamApiMock } = vi.hoisted(() => ({
  paperExamApiMock: {
    clonePaperExamTemplateVersionRequest: vi.fn(),
    createPaperExamTemplateRequest: vi.fn(),
    createPaperExamTemplateVersionRequest: vi.fn(),
    getPaperExamTemplateRequest: vi.fn(),
    getPaperExamTemplatesRequest: vi.fn(),
    publishPaperExamTemplateVersionRequest: vi.fn(),
    updatePaperExamTemplateVersionRequest: vi.fn(),
    upsertPaperExamMetadataFieldsRequest: vi.fn(),
    uploadPaperExamTemplateAssetRequest: vi.fn(),
    validatePaperExamTemplateVersionRequest: vi.fn(),
  },
}))

vi.mock('@/features/paper-exams/lib/paper-exam-api', () => paperExamApiMock)

function renderPage(path = '/teacher/paper-exams') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<PaperExamTemplatesPage />} path="/teacher/paper-exams" />
      </Routes>
    </MemoryRouter>,
  )
}

const publishedVersion = {
  id: 'version-2',
  templateId: 'template-1',
  versionNumber: 2,
  schemaVersion: '1.0',
  geometryConfigHash: 'geom-published',
  status: 'Published',
  questionCount: 10,
  optionsPerQuestion: 4,
  absThreshold: 0.7,
  relThreshold: 0.25,
  scoringMethod: 'annulus_patch_darkness',
  scoringParamsJson: '{}',
  payloadSchemaVersion: '1.0',
  minClientAppVersion: null,
  createdAtUtc: '2026-04-20T00:00:00.000Z',
  updatedAtUtc: '2026-04-20T00:00:00.000Z',
  publishedAtUtc: '2026-04-21T00:00:00.000Z',
  assets: [
    {
      id: 'asset-image',
      assetType: 'TemplateImage',
      storagePath: 'template.png',
      contentHash: 'image-hash',
      jsonContent: '',
      isRequired: true,
    },
  ],
  metadataFields: [],
}

const draftVersion = {
  ...publishedVersion,
  id: 'version-1',
  versionNumber: 1,
  status: 'Draft',
  geometryConfigHash: '',
  publishedAtUtc: null,
  assets: [
    ...publishedVersion.assets,
    {
      id: 'asset-marker',
      assetType: 'MarkerLayout',
      storagePath: '',
      contentHash: 'marker-hash',
      jsonContent: '{"marker":true}',
      isRequired: true,
    },
    {
      id: 'asset-circle',
      assetType: 'CircleRois',
      storagePath: '',
      contentHash: 'circle-hash',
      jsonContent: '{"circles":[]}',
      isRequired: true,
    },
  ],
  metadataFields: [
    {
      id: 'field-1',
      fieldCode: 'student_id',
      label: 'Student ID',
      isRequired: true,
      decodeMode: 'bubble_grid',
      geometryJson: '{"x":0}',
      validationPolicyJson: '{}',
    },
  ],
}

const templateSummary = {
  id: 'template-1',
  code: 'OMR-1',
  name: 'OMR sheet',
  description: 'Offline exam template',
  status: 'Published',
  paperSize: 'A4',
  outputWidth: 2480,
  outputHeight: 3508,
  markerScheme: 'custom',
  hasStudentIdField: true,
  hasQuizIdField: true,
  hasHandwrittenRegions: false,
  createdAtUtc: '2026-04-20T00:00:00.000Z',
  updatedAtUtc: '2026-04-20T00:00:00.000Z',
  versions: [draftVersion, publishedVersion],
}

const draftTemplateSummary = {
  ...templateSummary,
  id: 'template-2',
  code: 'OMR-DRAFT',
  name: 'Backup draft sheet',
  description: 'Draft-only local catalog item',
  status: 'Draft',
  versions: [
    {
      ...draftVersion,
      id: 'version-draft-only',
      templateId: 'template-2',
    },
  ],
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('PaperExamTemplatesPage', () => {
  it('creates a template and a blank draft version', async () => {
    const user = userEvent.setup()
    const createdTemplate = {
      ...templateSummary,
      versions: [],
    }
    const afterVersionCreation = {
      ...createdTemplate,
      versions: [draftVersion],
    }

    paperExamApiMock.getPaperExamTemplatesRequest
      .mockResolvedValueOnce([])
      .mockResolvedValue([{ ...createdTemplate }])
      .mockResolvedValue([{ ...afterVersionCreation }])
    paperExamApiMock.getPaperExamTemplateRequest
      .mockResolvedValueOnce(createdTemplate)
      .mockResolvedValueOnce(afterVersionCreation)
    paperExamApiMock.createPaperExamTemplateRequest.mockResolvedValue(createdTemplate)
    paperExamApiMock.createPaperExamTemplateVersionRequest.mockResolvedValue(draftVersion)

    renderPage()

    await screen.findByRole('heading', { name: 'Template workspace' })
    await user.type(screen.getByLabelText('Code'), 'OMR-1')
    await user.type(screen.getByLabelText('Name'), 'OMR sheet')
    await user.click(screen.getByRole('button', { name: 'Create template' }))

    await waitFor(() => {
      expect(paperExamApiMock.createPaperExamTemplateRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'OMR-1',
          name: 'OMR sheet',
        }),
      )
    })

    await screen.findByText('This template does not have a version yet. Create a blank draft below.')
    await user.click(screen.getByRole('button', { name: 'Create blank draft' }))

    await waitFor(() => {
      expect(
        paperExamApiMock.createPaperExamTemplateVersionRequest,
      ).toHaveBeenCalledWith(
        'template-1',
        expect.objectContaining({
          questionCount: 1,
          optionsPerQuestion: 4,
        }),
      )
    })
  })

  it('respects query-string selection and clones a published version', async () => {
    const user = userEvent.setup()
    const clonedVersion = {
      ...publishedVersion,
      id: 'version-3',
      versionNumber: 3,
      status: 'Draft',
      publishedAtUtc: null,
    }
    const detailAfterClone = {
      ...templateSummary,
      versions: [clonedVersion, publishedVersion],
    }

    paperExamApiMock.getPaperExamTemplatesRequest
      .mockResolvedValueOnce([templateSummary])
      .mockResolvedValue([detailAfterClone])
    paperExamApiMock.getPaperExamTemplateRequest
      .mockResolvedValueOnce(templateSummary)
      .mockResolvedValue(detailAfterClone)
    paperExamApiMock.clonePaperExamTemplateVersionRequest.mockResolvedValue(
      clonedVersion,
    )

    renderPage('/teacher/paper-exams?templateId=template-1&versionId=version-2')

    await screen.findByText('Published versions are read-only')
    expect(paperExamApiMock.getPaperExamTemplateRequest).toHaveBeenCalledWith('template-1')

    await user.click(screen.getByRole('button', { name: 'Clone to draft' }))

    await waitFor(() => {
      expect(
        paperExamApiMock.clonePaperExamTemplateVersionRequest,
      ).toHaveBeenCalledWith('template-1', 'version-2')
    })
  })

  it('updates a draft version', async () => {
    const user = userEvent.setup()
    const detailTemplate = {
      ...templateSummary,
      versions: [draftVersion, publishedVersion],
    }

    paperExamApiMock.getPaperExamTemplatesRequest
      .mockResolvedValueOnce([templateSummary])
      .mockResolvedValue([detailTemplate])
    paperExamApiMock.getPaperExamTemplateRequest
      .mockResolvedValueOnce(detailTemplate)
      .mockResolvedValue(detailTemplate)
    paperExamApiMock.updatePaperExamTemplateVersionRequest.mockResolvedValue(
      draftVersion,
    )
    paperExamApiMock.upsertPaperExamMetadataFieldsRequest.mockResolvedValue([])
    paperExamApiMock.uploadPaperExamTemplateAssetRequest.mockResolvedValue(
      draftVersion.assets[0],
    )

    renderPage('/teacher/paper-exams?templateId=template-1&versionId=version-1')

    await screen.findByRole('button', { name: 'Save version fields' })
    await user.click(screen.getByRole('button', { name: 'Save version fields' }))

    await waitFor(() => {
      expect(
        paperExamApiMock.updatePaperExamTemplateVersionRequest,
      ).toHaveBeenCalledWith(
        'template-1',
        'version-1',
        expect.objectContaining({
          schemaVersion: '1.0',
        }),
      )
    })
    await screen.findByText('Version updated')
  })

  it('validates and publishes a draft version', async () => {
    const user = userEvent.setup()
    const validatedResult = {
      templateVersionId: 'version-1',
      isValid: true,
      geometryConfigHash: 'geom-draft',
      errors: [],
      warnings: [],
    }
    const detailTemplate = {
      ...templateSummary,
      versions: [draftVersion, publishedVersion],
    }
    const publishedDraft = {
      ...draftVersion,
      status: 'Published',
      publishedAtUtc: '2026-04-22T00:00:00.000Z',
    }
    const detailAfterPublish = {
      ...templateSummary,
      versions: [publishedDraft, publishedVersion],
    }

    paperExamApiMock.getPaperExamTemplatesRequest
      .mockResolvedValueOnce([templateSummary])
      .mockResolvedValueOnce([detailTemplate])
      .mockResolvedValue([detailAfterPublish])
    paperExamApiMock.getPaperExamTemplateRequest
      .mockResolvedValueOnce(detailTemplate)
      .mockResolvedValueOnce(detailTemplate)
      .mockResolvedValue(detailAfterPublish)
    paperExamApiMock.validatePaperExamTemplateVersionRequest.mockResolvedValue(
      validatedResult,
    )
    paperExamApiMock.publishPaperExamTemplateVersionRequest.mockResolvedValue(
      publishedDraft,
    )

    renderPage('/teacher/paper-exams?templateId=template-1&versionId=version-1')

    await screen.findByRole('button', { name: 'Validate version' })
    await user.click(screen.getByRole('button', { name: 'Validate version' }))

    await waitFor(() => {
      expect(
        paperExamApiMock.validatePaperExamTemplateVersionRequest,
      ).toHaveBeenCalledWith('template-1', 'version-1')
    })
    await screen.findByText('Version validated')

    await user.click(screen.getByRole('button', { name: 'Publish version' }))

    await waitFor(() => {
      expect(
        paperExamApiMock.publishPaperExamTemplateVersionRequest,
      ).toHaveBeenCalledWith('template-1', 'version-1')
    })
  })

  it('filters the local template catalog by search text and status', async () => {
    const user = userEvent.setup()

    paperExamApiMock.getPaperExamTemplatesRequest.mockResolvedValue([
      templateSummary,
      draftTemplateSummary,
    ])
    paperExamApiMock.getPaperExamTemplateRequest.mockResolvedValue(templateSummary)

    renderPage()

    await screen.findByText('OMR sheet')
    expect(screen.getByText('Backup draft sheet')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Search templates'), 'backup')

    const catalog = screen.getByTestId('paper-template-catalog')
    expect(within(catalog).queryByText('OMR sheet')).not.toBeInTheDocument()
    expect(within(catalog).getByText('Backup draft sheet')).toBeInTheDocument()

    await user.clear(screen.getByLabelText('Search templates'))
    await user.click(screen.getByRole('tab', { name: 'Draft' }))

    const filteredCatalog = screen.getByTestId('paper-template-catalog')
    expect(within(filteredCatalog).queryByText('OMR sheet')).not.toBeInTheDocument()
    expect(within(filteredCatalog).getByText('Backup draft sheet')).toBeInTheDocument()
  })

  it('renders selected template and version summaries from real fields', async () => {
    paperExamApiMock.getPaperExamTemplatesRequest.mockResolvedValue([templateSummary])
    paperExamApiMock.getPaperExamTemplateRequest.mockResolvedValue(templateSummary)

    renderPage('/teacher/paper-exams?templateId=template-1&versionId=version-1')

    await screen.findByText('Configuration preview')
    expect(screen.getAllByText('2480 x 3508').length).toBeGreaterThan(0)
    expect(screen.getAllByText('image-hash').length).toBeGreaterThan(0)
    expect(screen.getByText('MarkerLayout JSON')).toBeInTheDocument()
    expect(screen.getByText('Student ID')).toBeInTheDocument()
  })

  it('renders validation summary after validate without changing publish flow', async () => {
    const user = userEvent.setup()
    const validatedResult = {
      templateVersionId: 'version-1',
      isValid: false,
      geometryConfigHash: 'geom-invalid',
      errors: ['Marker layout is missing a corner anchor.'],
      warnings: ['Template image should be reviewed.'],
    }
    const detailTemplate = {
      ...templateSummary,
      versions: [draftVersion, publishedVersion],
    }

    paperExamApiMock.getPaperExamTemplatesRequest.mockResolvedValue([templateSummary])
    paperExamApiMock.getPaperExamTemplateRequest.mockResolvedValue(detailTemplate)
    paperExamApiMock.validatePaperExamTemplateVersionRequest.mockResolvedValue(
      validatedResult,
    )

    renderPage('/teacher/paper-exams?templateId=template-1&versionId=version-1')

    await screen.findByRole('button', { name: 'Validate version' })
    await user.click(screen.getByRole('button', { name: 'Validate version' }))

    await screen.findByText('Validation result: Invalid')
    expect(screen.getByText(/geom-invalid/)).toBeInTheDocument()
    expect(
      screen.getByText('Marker layout is missing a corner anchor.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Template image should be reviewed.')).toBeInTheDocument()
  })

  it('shows a no-results empty state for local filters', async () => {
    const user = userEvent.setup()

    paperExamApiMock.getPaperExamTemplatesRequest.mockResolvedValue([templateSummary])
    paperExamApiMock.getPaperExamTemplateRequest.mockResolvedValue(templateSummary)

    renderPage()

    await screen.findByText('OMR sheet')
    await user.type(screen.getByLabelText('Search templates'), 'not-present')

    expect(screen.getByText('No matching templates')).toBeInTheDocument()
    expect(screen.queryByTestId('paper-template-catalog')).not.toBeInTheDocument()
  })
})
