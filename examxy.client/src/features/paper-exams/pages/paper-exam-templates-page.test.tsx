import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PaperExamTemplatesPage } from '@/features/paper-exams/pages/paper-exam-templates-page'

const { authContextMock, paperExamApiMock } = vi.hoisted(() => ({
  authContextMock: {
    session: {
      primaryRole: 'Teacher',
    },
  },
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
vi.mock('@/features/auth/auth-context', () => ({
  useAuth: () => authContextMock,
}))

function setSessionRole(primaryRole: 'Admin' | 'Teacher') {
  authContextMock.session = { primaryRole }
}

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
  setSessionRole('Teacher')
})

describe('PaperExamTemplatesPage', () => {
  it('keeps refresh in the template catalog toolbar instead of page actions', async () => {
    const user = userEvent.setup()

    paperExamApiMock.getPaperExamTemplatesRequest.mockResolvedValue([templateSummary])
    paperExamApiMock.getPaperExamTemplateRequest.mockResolvedValue(templateSummary)

    renderPage()

    await screen.findByRole('heading', { name: 'Không gian làm việc mẫu' })

    const pageActions = screen.getByRole('navigation', { name: 'Thao tác trang bài thi giấy' })
    expect(within(pageActions).getByRole('button', { name: 'Tạo mẫu' })).toBeInTheDocument()
    expect(within(pageActions).getByRole('link', { name: 'Quay lại bảng điều khiển' })).toBeInTheDocument()
    expect(within(pageActions).queryByRole('button', { name: 'Làm mới' })).not.toBeInTheDocument()

    const catalog = screen.getByRole('region', { name: 'Danh mục mẫu' })
    await user.click(within(catalog).getByRole('button', { name: 'Làm mới' }))

    await waitFor(() => {
      expect(paperExamApiMock.getPaperExamTemplatesRequest).toHaveBeenCalledTimes(2)
    })
  })

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

    await screen.findByRole('heading', { name: 'Không gian làm việc mẫu' })
    await user.click(screen.getByRole('button', { name: 'Tạo mẫu' }))
    await user.type(await screen.findByLabelText('Mã mẫu'), 'OMR-1')
    await user.type(screen.getByLabelText('Tên'), 'OMR sheet')
    await user.click(screen.getByRole('button', { name: 'Tạo template và bản nháp' }))

    await waitFor(() => {
      expect(paperExamApiMock.createPaperExamTemplateRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'OMR-1',
          name: 'OMR sheet',
        }),
      )
    })

    await waitFor(() => {
      expect(
        paperExamApiMock.createPaperExamTemplateVersionRequest,
      ).toHaveBeenCalledWith(
        'template-1',
        expect.objectContaining({
          questionCount: 40,
          optionsPerQuestion: 5,
        }),
      )
    })
    expect(paperExamApiMock.uploadPaperExamTemplateAssetRequest).toHaveBeenCalledTimes(4)
    expect(paperExamApiMock.upsertPaperExamMetadataFieldsRequest).toHaveBeenCalledWith(
      'template-1',
      'version-1',
      expect.arrayContaining([
        expect.objectContaining({ fieldCode: 'student_id' }),
        expect.objectContaining({ fieldCode: 'quiz_id' }),
      ]),
    )
  })

  it('respects query-string selection and clones a published version', async () => {
    const user = userEvent.setup()
    setSessionRole('Admin')
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

    await user.click(await screen.findByRole('button', { name: /OMR sheet/ }))
    await user.click(screen.getByRole('tab', { name: 'Phiên bản' }))
    await user.click(screen.getByRole('button', { name: /Phiên bản 2/ }))
    await screen.findByRole('button', { name: 'Nhân bản thành bản nháp' })
    expect(paperExamApiMock.getPaperExamTemplateRequest).toHaveBeenCalledWith('template-1')

    await user.click(screen.getByRole('button', { name: 'Nhân bản thành bản nháp' }))
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Nhân bản thành bản nháp' }))

    await waitFor(() => {
      expect(
        paperExamApiMock.clonePaperExamTemplateVersionRequest,
      ).toHaveBeenCalledWith('template-1', 'version-2')
    })
  })

  it('updates a draft version', async () => {
    const user = userEvent.setup()
    setSessionRole('Admin')
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

    await user.click(await screen.findByRole('button', { name: /OMR sheet/ }))
    await user.click(screen.getByRole('tab', { name: 'Cấu hình kỹ thuật' }))
    await user.click(screen.getByRole('tab', { name: 'Cài đặt cốt lõi' }))
    await screen.findByRole('button', { name: 'Lưu các trường phiên bản' })
    await user.click(screen.getByRole('button', { name: 'Lưu các trường phiên bản' }))

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
    setSessionRole('Admin')
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

    await user.click(await screen.findByRole('button', { name: /OMR sheet/ }))
    await user.click(screen.getByRole('tab', { name: 'Cấu hình kỹ thuật' }))
    await user.click(screen.getByRole('tab', { name: 'Xác thực & Xuất bản' }))
    await screen.findByRole('button', { name: 'Xác thực phiên bản' })
    await user.click(screen.getByRole('button', { name: 'Xác thực phiên bản' }))

    await waitFor(() => {
      expect(
        paperExamApiMock.validatePaperExamTemplateVersionRequest,
      ).toHaveBeenCalledWith('template-1', 'version-1')
    })
    await screen.findByText('Version validated')

    await user.click(screen.getByRole('button', { name: 'Xuất bản phiên bản' }))
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Xuất bản phiên bản' }))

    await waitFor(() => {
      expect(
        paperExamApiMock.publishPaperExamTemplateVersionRequest,
      ).toHaveBeenCalledWith('template-1', 'version-1')
    })
  })

  it('filters the local template catalog by search text and status', async () => {
    const user = userEvent.setup()
    setSessionRole('Admin')

    paperExamApiMock.getPaperExamTemplatesRequest.mockResolvedValue([
      templateSummary,
      draftTemplateSummary,
    ])
    paperExamApiMock.getPaperExamTemplateRequest.mockResolvedValue(templateSummary)

    renderPage()

    await screen.findByText('OMR sheet')
    expect(screen.getByText('Backup draft sheet')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Tìm kiếm mẫu'), 'backup')

    const catalog = screen.getByTestId('paper-template-catalog')
    expect(within(catalog).queryByText('OMR sheet')).not.toBeInTheDocument()
    expect(within(catalog).getByText('Backup draft sheet')).toBeInTheDocument()

    await user.clear(screen.getByLabelText('Tìm kiếm mẫu'))
    await user.click(screen.getByRole('tab', { name: 'Draft' }))

    const filteredCatalog = screen.getByTestId('paper-template-catalog')
    expect(within(filteredCatalog).queryByText('OMR sheet')).not.toBeInTheDocument()
    expect(within(filteredCatalog).getByText('Backup draft sheet')).toBeInTheDocument()
  })

  it('renders teacher detail without technical admin controls', async () => {
    const user = userEvent.setup()

    paperExamApiMock.getPaperExamTemplatesRequest.mockResolvedValue([templateSummary])
    paperExamApiMock.getPaperExamTemplateRequest.mockResolvedValue(templateSummary)

    renderPage('/teacher/paper-exams?templateId=template-1&versionId=version-1')

    await user.click(await screen.findByRole('button', { name: /OMR sheet/ }))
    await screen.findByRole('button', { name: 'Xuất PDF' })
    expect(screen.getAllByText('2480 x 3508').length).toBeGreaterThan(0)
    expect(screen.getAllByText('image-hash').length).toBeGreaterThan(0)
    expect(screen.queryByText('MarkerLayout JSON')).not.toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: 'Cấu hình kỹ thuật' })).not.toBeInTheDocument()
  })

  it('lets admins update visual geometry into JSON drafts before saving', async () => {
    const user = userEvent.setup()
    setSessionRole('Admin')

    paperExamApiMock.getPaperExamTemplatesRequest.mockResolvedValue([templateSummary])
    paperExamApiMock.getPaperExamTemplateRequest.mockResolvedValue({
      ...templateSummary,
      versions: [draftVersion, publishedVersion],
    })

    renderPage('/teacher/paper-exams?templateId=template-1&versionId=version-1')

    await user.click(await screen.findByRole('button', { name: /OMR sheet/ }))
    await user.click(screen.getByRole('tab', { name: 'Visual editor' }))

    const cxInput = await screen.findByLabelText('CX')
    await user.clear(cxInput)
    await user.type(cxInput, '123')

    await user.click(screen.getByRole('tab', { name: 'Cấu hình kỹ thuật' }))
    await user.click(screen.getByRole('tab', { name: 'Tài nguyên' }))

    expect(
      (screen.getByLabelText('CircleRois JSON') as HTMLTextAreaElement).value,
    ).toContain('"cx": 123')
  })

  it('renders validation summary after validate without changing publish flow', async () => {
    const user = userEvent.setup()
    setSessionRole('Admin')
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

    await user.click(await screen.findByRole('button', { name: /OMR sheet/ }))
    await user.click(screen.getByRole('tab', { name: 'Cấu hình kỹ thuật' }))
    await user.click(screen.getByRole('tab', { name: 'Xác thực & Xuất bản' }))
    await screen.findByRole('button', { name: 'Xác thực phiên bản' })
    await user.click(screen.getByRole('button', { name: 'Xác thực phiên bản' }))

    await screen.findByText('Kết quả kiểm tra: Không hợp lệ')
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
    await user.type(screen.getByLabelText('Tìm kiếm mẫu'), 'not-present')

    expect(screen.getByText('Không tìm thấy mẫu phù hợp')).toBeInTheDocument()
    expect(screen.queryByTestId('paper-template-catalog')).not.toBeInTheDocument()
  })
})
