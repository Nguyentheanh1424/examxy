import type { ChangeEvent, FormEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import {
  createJsonAssetDrafts,
  createMetadataDrafts,
  emptyJsonAssetDrafts,
  emptyTemplateDraft,
  emptyVersionDraft,
  fileToBase64,
  getAssetByType,
  jsonAssetTypes,
  toCreateTemplateRequest,
  toVersionDraftState,
  toVersionRequest,
  updateSearchSelection,
  type JsonAssetType,
  type MetadataFieldDraftState,
  type TemplateDraftState,
  type VersionDraftState,
} from '@/features/paper-exams/lib/paper-exam-template-mappers'
import {
  defaultTemplateSettings,
  generateIdBubbleFields,
  generatedJsonAssets,
  type TemplateSettings,
} from '@/features/paper-exams/lib/paper-exam-template-generator'

import {
  clonePaperExamTemplateVersionRequest,
  createPaperExamTemplateRequest,
  createPaperExamTemplateVersionRequest,
  getPaperExamTemplateRequest,
  getPaperExamTemplatesRequest,
  publishPaperExamTemplateVersionRequest,
  updatePaperExamTemplateVersionRequest,
  upsertPaperExamMetadataFieldsRequest,
  uploadPaperExamTemplateAssetRequest,
  validatePaperExamTemplateVersionRequest,
} from '@/features/paper-exams/lib/paper-exam-api'
import { templateMatchesSearch } from '@/features/paper-exams/lib/paper-exam-display'
import { getErrorMessage } from '@/lib/http/api-error'
import type {
  PaperExamTemplate,
  PaperExamTemplateVersion,
  UpsertPaperExamMetadataFieldRequest,
  ValidatePaperExamTemplateVersionResult,
} from '@/types/paper-exam'

export function usePaperExamTemplatesPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [templates, setTemplates] = useState<PaperExamTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<PaperExamTemplate | null>(
    null,
  )
  const [templateDraft, setTemplateDraft] = useState<TemplateDraftState>(
    emptyTemplateDraft,
  )
  const [newVersionDraft, setNewVersionDraft] = useState<VersionDraftState>(
    emptyVersionDraft,
  )
  const [editorDraft, setEditorDraft] = useState<VersionDraftState>(emptyVersionDraft)
  const [jsonAssetDrafts, setJsonAssetDrafts] =
    useState<Record<JsonAssetType, string>>(emptyJsonAssetDrafts)
  const [templateImageFile, setTemplateImageFile] = useState<File | null>(null)
  const [metadataFieldDrafts, setMetadataFieldDrafts] = useState<
    MetadataFieldDraftState[]
  >([])
  const [validationResult, setValidationResult] =
    useState<ValidatePaperExamTemplateVersionResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isTemplateLoading, setIsTemplateLoading] = useState(false)
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<{
    tone: 'error' | 'success'
    title: string
    message: string
  } | null>(null)
  const [catalogSearch, setCatalogSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false)
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false)
  const [publishDialogOpen, setPublishDialogOpen] = useState(false)

  // Tracks the templateId of the most recent in-flight fetch so stale responses
  // from superseded requests are discarded rather than written to state.
  const activeTemplateIdRef = useRef<string | null>(null)

  const selectedTemplateId = searchParams.get('templateId')
  const selectedVersionId = searchParams.get('versionId')

  const selectedVersion = useMemo(
    () =>
      selectedTemplate?.versions.find((version) => version.id === selectedVersionId) ??
      null,
    [selectedTemplate, selectedVersionId],
  )

  const selectedTemplateImageAsset = useMemo(
    () => getAssetByType(selectedVersion, 'TemplateImage'),
    [selectedVersion],
  )

  const selectedVersionIsPublished = selectedVersion?.status === 'Published'

  const statusTabs = useMemo(
    () => [
      'All',
      ...Array.from(new Set(templates.map((template) => template.status))).sort(),
    ],
    [templates],
  )

  const filteredTemplates = useMemo(
    () =>
      templates.filter(
        (template) =>
          (statusFilter === 'All' || template.status === statusFilter) &&
          templateMatchesSearch(template, catalogSearch),
      ),
    [catalogSearch, statusFilter, templates],
  )

  const catalogMetrics = useMemo(() => {
    const versionCount = templates.reduce(
      (total, template) => total + template.versions.length,
      0,
    )
    const publishedVersionCount = templates.reduce(
      (total, template) =>
        total +
        template.versions.filter((version) => version.status === 'Published').length,
      0,
    )

    return {
      publishedVersionCount,
      templateCount: templates.length,
      versionCount,
    }
  }, [templates])

  async function loadTemplates() {
    const response = await getPaperExamTemplatesRequest()
    setTemplates(response)
    return response
  }

  async function loadTemplateDetail(templateId: string) {
    activeTemplateIdRef.current = templateId
    setIsTemplateLoading(true)

    try {
      const response = await getPaperExamTemplateRequest(templateId)
      // Discard stale responses if a newer fetch has been initiated.
      if (activeTemplateIdRef.current === templateId) {
        setSelectedTemplate(response)
      }
      return response
    } finally {
      // Only clear the loading indicator for the most recent request.
      if (activeTemplateIdRef.current === templateId) {
        setIsTemplateLoading(false)
      }
    }
  }

  async function refreshWorkspace(
    nextTemplateId = selectedTemplateId,
    nextVersionId = selectedVersionId,
  ) {
    const templatesResponse = await loadTemplates()

    if (!nextTemplateId) {
      setSelectedTemplate(null)
      return templatesResponse
    }

    const detail = await loadTemplateDetail(nextTemplateId)
    const resolvedVersionId =
      nextVersionId &&
      detail.versions.some((candidate) => candidate.id === nextVersionId)
        ? nextVersionId
        : detail.versions[0]?.id ?? null

    updateSearchSelection(setSearchParams, detail.id, resolvedVersionId)
    return templatesResponse
  }

  useEffect(() => {
    void (async () => {
      setError(null)

      try {
        await loadTemplates()
      } catch (nextError) {
        setError(getErrorMessage(nextError, 'Unable to load paper-exam templates.'))
      } finally {
        setIsLoading(false)
      }
    })()
  }, [])

  useEffect(() => {
    if (isLoading || templates.length === 0) {
      return
    }

    const hasSelectedTemplate = selectedTemplateId
      ? templates.some((template) => template.id === selectedTemplateId)
      : false

    if (!hasSelectedTemplate) {
      const fallbackTemplate = templates[0]
      updateSearchSelection(
        setSearchParams,
        fallbackTemplate.id,
        fallbackTemplate.versions[0]?.id ?? null,
      )
    }
  }, [isLoading, selectedTemplateId, setSearchParams, templates])

  useEffect(() => {
    if (!selectedTemplateId) {
      activeTemplateIdRef.current = null
      setSelectedTemplate(null)
      setIsTemplateLoading(false)
      return
    }

    // Immediately clear stale template data so the popup shows a loading
    // state instead of the previously-selected template's content.
    setSelectedTemplate((current) =>
      current?.id === selectedTemplateId ? current : null,
    )

    void (async () => {
      try {
        await loadTemplateDetail(selectedTemplateId)
      } catch (nextError) {
        // Only surface the error if this request is still the active one.
        if (activeTemplateIdRef.current === selectedTemplateId) {
          setNotice({
            tone: 'error',
            title: 'Unable to load template details',
            message: getErrorMessage(
              nextError,
              'The selected template could not be loaded.',
            ),
          })
        }
      }
    })()
  }, [selectedTemplateId])

  useEffect(() => {
    if (!selectedTemplate) {
      return
    }

    const versionExists = selectedVersionId
      ? selectedTemplate.versions.some((version) => version.id === selectedVersionId)
      : false

    if (!versionExists) {
      updateSearchSelection(
        setSearchParams,
        selectedTemplate.id,
        selectedTemplate.versions[0]?.id ?? null,
      )
    }
  }, [selectedTemplate, selectedVersionId, setSearchParams])

  useEffect(() => {
    setValidationResult(null)
    setTemplateImageFile(null)

    if (!selectedVersion) {
      setEditorDraft(emptyVersionDraft)
      setJsonAssetDrafts(emptyJsonAssetDrafts)
      setMetadataFieldDrafts([])
      return
    }

    setEditorDraft(toVersionDraftState(selectedVersion))
    setJsonAssetDrafts(createJsonAssetDrafts(selectedVersion))
    setMetadataFieldDrafts(createMetadataDrafts(selectedVersion))
    if (selectedTemplate) {
      setTemplateDraft(createTemplateDraftFromSelection(selectedTemplate, selectedVersion))
    }
  }, [selectedTemplate, selectedVersion])

  async function handleCreateTemplate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusyKey('create-template')
    setNotice(null)

    try {
      const created = await createPaperExamTemplateRequest(
        toCreateTemplateRequest(templateDraft),
      )
      const settings = templateDraft.settings
      const createdVersion = await createPaperExamTemplateVersionRequest(created.id, {
        ...toVersionRequest(emptyVersionDraft),
        optionsPerQuestion: settings.optionsPerQuestion,
        questionCount: settings.numQuestions,
      })
      const generatedAssets = generatedJsonAssets(settings)

      for (const assetType of jsonAssetTypes) {
        await uploadPaperExamTemplateAssetRequest(created.id, createdVersion.id, {
          assetType,
          base64Content: null,
          contentType: 'application/json',
          fileName: `${assetType}.json`,
          isRequired: assetType === 'MarkerLayout' || assetType === 'CircleRois',
          jsonContent: generatedAssets[assetType],
        })
      }

      await upsertPaperExamMetadataFieldsRequest(
        created.id,
        createdVersion.id,
        createMetadataPayloadFromSettings(settings),
      )

      setTemplateDraft(emptyTemplateDraft)
      setSelectedTemplate(created)
      await refreshWorkspace(created.id, createdVersion.id)
      setCreateDrawerOpen(false)
      setNotice({
        tone: 'success',
        title: 'Template created',
        message:
          'A draft version and generated OMR assets were created from the basic settings.',
      })
    } catch (nextError) {
      setNotice({
        tone: 'error',
        title: 'Unable to create template',
        message: getErrorMessage(
          nextError,
          'The paper-exam template could not be created.',
        ),
      })
    } finally {
      setBusyKey(null)
    }
  }

  async function handleCreateVersion() {
    if (!selectedTemplate) {
      return
    }

    setBusyKey('create-version')
    setNotice(null)

    try {
      const createdVersion = await createPaperExamTemplateVersionRequest(
        selectedTemplate.id,
        toVersionRequest(newVersionDraft),
      )
      setNewVersionDraft(emptyVersionDraft)
      await refreshWorkspace(selectedTemplate.id, createdVersion.id)
      setNotice({
        tone: 'success',
        title: 'Draft version created',
        message: 'The new version is ready for asset upload, validation, and publish.',
      })
    } catch (nextError) {
      setNotice({
        tone: 'error',
        title: 'Unable to create version',
        message: getErrorMessage(
          nextError,
          'The template version could not be created.',
        ),
      })
    } finally {
      setBusyKey(null)
    }
  }

  async function handleCloneVersion() {
    if (!selectedTemplate || !selectedVersion) {
      return
    }

    setBusyKey('clone-version')
    setNotice(null)

    try {
      const clone = await clonePaperExamTemplateVersionRequest(
        selectedTemplate.id,
        selectedVersion.id,
      )
      await refreshWorkspace(selectedTemplate.id, clone.id)
      setCloneDialogOpen(false)
      setNotice({
        tone: 'success',
        title: 'Draft cloned',
        message: 'The published version has been copied into a new editable draft.',
      })
    } catch (nextError) {
      setNotice({
        tone: 'error',
        title: 'Unable to clone version',
        message: getErrorMessage(
          nextError,
          'The version could not be cloned to a new draft.',
        ),
      })
    } finally {
      setBusyKey(null)
    }
  }

  async function handleSaveVersion() {
    if (!selectedTemplate || !selectedVersion) {
      return
    }

    setBusyKey('save-version')
    setNotice(null)

    try {
      await updatePaperExamTemplateVersionRequest(
        selectedTemplate.id,
        selectedVersion.id,
        toVersionRequest(editorDraft),
      )
      await refreshWorkspace(selectedTemplate.id, selectedVersion.id)
      setNotice({
        tone: 'success',
        title: 'Version updated',
        message: 'Core version settings were saved.',
      })
    } catch (nextError) {
      setNotice({
        tone: 'error',
        title: 'Unable to save version',
        message: getErrorMessage(
          nextError,
          'The draft version changes could not be saved.',
        ),
      })
    } finally {
      setBusyKey(null)
    }
  }

  async function handleSaveBasicTemplateSettings() {
    if (!selectedTemplate || !selectedVersion) {
      return
    }

    if (selectedVersionIsPublished) {
      setNotice({
        tone: 'error',
        title: 'Không thể lưu phiên bản đã xuất bản',
        message:
          'Hãy nhờ Admin nhân bản phiên bản này thành bản nháp trước khi chỉnh thông số.',
      })
      return
    }

    const settings = templateDraft.settings
    const nextEditorDraft: VersionDraftState = {
      ...editorDraft,
      optionsPerQuestion: String(settings.optionsPerQuestion),
      questionCount: String(settings.numQuestions),
    }
    const generatedAssets = generatedJsonAssets(settings)
    const metadataPayload = createMetadataPayloadFromSettings(settings)

    setBusyKey('save-basic-settings')
    setNotice(null)

    try {
      await updatePaperExamTemplateVersionRequest(
        selectedTemplate.id,
        selectedVersion.id,
        toVersionRequest(nextEditorDraft),
      )

      for (const assetType of jsonAssetTypes) {
        await uploadPaperExamTemplateAssetRequest(selectedTemplate.id, selectedVersion.id, {
          assetType,
          base64Content: null,
          contentType: 'application/json',
          fileName: `${assetType}.json`,
          isRequired: assetType === 'MarkerLayout' || assetType === 'CircleRois',
          jsonContent: generatedAssets[assetType],
        })
      }

      await upsertPaperExamMetadataFieldsRequest(
        selectedTemplate.id,
        selectedVersion.id,
        metadataPayload,
      )

      setEditorDraft(nextEditorDraft)
      setJsonAssetDrafts(generatedAssets)
      setMetadataFieldDrafts(metadataPayload)
      await refreshWorkspace(selectedTemplate.id, selectedVersion.id)
      setNotice({
        tone: 'success',
        title: 'Đã lưu thông số mẫu',
        message:
          'Phiên bản nháp đã được cập nhật số câu, lựa chọn, vùng ID và tài nguyên JSON sinh tự động.',
      })
    } catch (nextError) {
      setNotice({
        tone: 'error',
        title: 'Không thể lưu thông số mẫu',
        message: getErrorMessage(
          nextError,
          'Các thay đổi cấu hình mẫu chưa được lưu.',
        ),
      })
    } finally {
      setBusyKey(null)
    }
  }

  async function handleUploadTemplateImage() {
    if (!selectedTemplate || !selectedVersion || !templateImageFile) {
      return
    }

    setBusyKey('upload-template-image')
    setNotice(null)

    try {
      const base64Content = await fileToBase64(templateImageFile)
      await uploadPaperExamTemplateAssetRequest(selectedTemplate.id, selectedVersion.id, {
        assetType: 'TemplateImage',
        base64Content,
        jsonContent: '',
        fileName: templateImageFile.name,
        contentType: templateImageFile.type || 'application/octet-stream',
        isRequired: true,
      })
      setTemplateImageFile(null)
      await refreshWorkspace(selectedTemplate.id, selectedVersion.id)
      setNotice({
        tone: 'success',
        title: 'Template image uploaded',
        message: 'The draft now has an updated template image asset.',
      })
    } catch (nextError) {
      setNotice({
        tone: 'error',
        title: 'Unable to upload template image',
        message: getErrorMessage(
          nextError,
          'The template image could not be uploaded.',
        ),
      })
    } finally {
      setBusyKey(null)
    }
  }

  async function handleSaveJsonAssets() {
    if (!selectedTemplate || !selectedVersion) {
      return
    }

    setBusyKey('save-json-assets')
    setNotice(null)

    try {
      for (const assetType of jsonAssetTypes) {
        const jsonContent = jsonAssetDrafts[assetType].trim()
        const currentAsset = getAssetByType(selectedVersion, assetType)

        if (!jsonContent || currentAsset?.jsonContent === jsonContent) {
          continue
        }

        await uploadPaperExamTemplateAssetRequest(selectedTemplate.id, selectedVersion.id, {
          assetType,
          base64Content: null,
          jsonContent,
          fileName: `${assetType}.json`,
          contentType: 'application/json',
          isRequired: assetType === 'MarkerLayout' || assetType === 'CircleRois',
        })
      }

      await refreshWorkspace(selectedTemplate.id, selectedVersion.id)
      setNotice({
        tone: 'success',
        title: 'JSON assets updated',
        message: 'Marker and region assets were saved for the draft.',
      })
    } catch (nextError) {
      setNotice({
        tone: 'error',
        title: 'Unable to save JSON assets',
        message: getErrorMessage(
          nextError,
          'The draft assets could not be updated.',
        ),
      })
    } finally {
      setBusyKey(null)
    }
  }

  async function handleSaveMetadataFields() {
    if (!selectedTemplate || !selectedVersion) {
      return
    }

    const payload = metadataFieldDrafts
      .map<UpsertPaperExamMetadataFieldRequest | null>((field) => {
        const fieldCode = field.fieldCode.trim()
        const label = field.label.trim()

        if (!fieldCode || !label) {
          return null
        }

        return {
          fieldCode,
          label,
          decodeMode: field.decodeMode.trim() || 'bubble_grid',
          isRequired: field.isRequired,
          geometryJson: field.geometryJson || '{}',
          validationPolicyJson: field.validationPolicyJson || '{}',
        }
      })
      .filter((field): field is UpsertPaperExamMetadataFieldRequest => field !== null)

    setBusyKey('save-metadata')
    setNotice(null)

    try {
      await upsertPaperExamMetadataFieldsRequest(
        selectedTemplate.id,
        selectedVersion.id,
        payload,
      )
      await refreshWorkspace(selectedTemplate.id, selectedVersion.id)
      setNotice({
        tone: 'success',
        title: 'Metadata fields updated',
        message: 'The template metadata mapping has been saved.',
      })
    } catch (nextError) {
      setNotice({
        tone: 'error',
        title: 'Unable to save metadata fields',
        message: getErrorMessage(
          nextError,
          'The metadata field changes could not be saved.',
        ),
      })
    } finally {
      setBusyKey(null)
    }
  }

  async function handleValidateVersion() {
    if (!selectedTemplate || !selectedVersion) {
      return
    }

    setBusyKey('validate-version')
    setNotice(null)

    try {
      const result = await validatePaperExamTemplateVersionRequest(
        selectedTemplate.id,
        selectedVersion.id,
      )
      await refreshWorkspace(selectedTemplate.id, selectedVersion.id)
      setValidationResult(result)
      setNotice({
        tone: result.isValid ? 'success' : 'error',
        title: result.isValid ? 'Version validated' : 'Validation failed',
        message: result.isValid
          ? 'The draft is ready to publish.'
          : 'Fix the reported validation errors before publishing.',
      })
    } catch (nextError) {
      setNotice({
        tone: 'error',
        title: 'Unable to validate version',
        message: getErrorMessage(
          nextError,
          'The version validation request failed.',
        ),
      })
    } finally {
      setBusyKey(null)
    }
  }

  async function handlePublishVersion() {
    if (!selectedTemplate || !selectedVersion) {
      return
    }

    setBusyKey('publish-version')
    setNotice(null)

    try {
      const publishedVersion = await publishPaperExamTemplateVersionRequest(
        selectedTemplate.id,
        selectedVersion.id,
      )
      await refreshWorkspace(selectedTemplate.id, publishedVersion.id)
      setPublishDialogOpen(false)
      setNotice({
        tone: 'success',
        title: 'Version published',
        message: 'The template version is now available for class assessment bindings.',
      })
    } catch (nextError) {
      setNotice({
        tone: 'error',
        title: 'Unable to publish version',
        message: getErrorMessage(
          nextError,
          'The version could not be published.',
        ),
      })
    } finally {
      setBusyKey(null)
    }
  }

  function handleTemplateImageChange(event: ChangeEvent<HTMLInputElement>) {
    setTemplateImageFile(event.target.files?.[0] ?? null)
  }

  return {
    searchParams,
    setSearchParams,
    templates,
    setTemplates,
    selectedTemplate,
    setSelectedTemplate,
    templateDraft,
    setTemplateDraft,
    newVersionDraft,
    setNewVersionDraft,
    editorDraft,
    setEditorDraft,
    jsonAssetDrafts,
    setJsonAssetDrafts,
    templateImageFile,
    setTemplateImageFile,
    metadataFieldDrafts,
    setMetadataFieldDrafts,
    validationResult,
    setValidationResult,
    isLoading,
    isTemplateLoading,
    busyKey,
    error,
    notice,
    catalogSearch,
    setCatalogSearch,
    statusFilter,
    setStatusFilter,
    createDrawerOpen,
    setCreateDrawerOpen,
    cloneDialogOpen,
    setCloneDialogOpen,
    publishDialogOpen,
    setPublishDialogOpen,
    selectedTemplateId,
    selectedVersionId,
    selectedVersion,
    selectedTemplateImageAsset,
    selectedVersionIsPublished,
    statusTabs,
    filteredTemplates,
    catalogMetrics,
    loadTemplates,
    loadTemplateDetail,
    refreshWorkspace,
    handleCreateTemplate,
    handleCreateVersion,
    handleCloneVersion,
    handleSaveBasicTemplateSettings,
    handleSaveVersion,
    handleUploadTemplateImage,
    handleSaveJsonAssets,
    handleSaveMetadataFields,
    handleValidateVersion,
    handlePublishVersion,
    handleTemplateImageChange,
  }
}

export type PaperExamTemplatesPageController = ReturnType<
  typeof usePaperExamTemplatesPage
>

function createTemplateDraftFromSelection(
  template: PaperExamTemplate,
  version: PaperExamTemplateVersion,
): TemplateDraftState {
  const idBubbleSettings = readIdBubbleSettings(version)

  return {
    ...emptyTemplateDraft,
    code: template.code,
    description: template.description,
    hasHandwrittenRegions: template.hasHandwrittenRegions,
    hasQuizIdField: template.hasQuizIdField,
    hasStudentIdField: template.hasStudentIdField,
    markerScheme: template.markerScheme,
    name: template.name,
    outputHeight: String(template.outputHeight ?? ''),
    outputWidth: String(template.outputWidth ?? ''),
    paperSize: template.paperSize,
    settings: {
      ...defaultTemplateSettings,
      headerLabels: {
        ...defaultTemplateSettings.headerLabels,
      },
      idBubbles: {
        quizId: {
          ...defaultTemplateSettings.idBubbles.quizId,
          ...idBubbleSettings.quizId,
        },
        studentId: {
          ...defaultTemplateSettings.idBubbles.studentId,
          ...idBubbleSettings.studentId,
        },
      },
      numQuestions: version.questionCount,
      optionsPerQuestion: version.optionsPerQuestion,
      showQuizIdField: template.hasQuizIdField,
      showStudentIdField: template.hasStudentIdField,
      visibleHeaderLabels: {
        class: template.hasHandwrittenRegions,
        name: template.hasHandwrittenRegions,
        quiz: template.hasHandwrittenRegions,
        score: template.hasHandwrittenRegions,
      },
    },
  }
}

function readIdBubbleSettings(version: PaperExamTemplateVersion) {
  const result: Pick<TemplateSettings, 'idBubbles'>['idBubbles'] = {
    quizId: { ...defaultTemplateSettings.idBubbles.quizId },
    studentId: { ...defaultTemplateSettings.idBubbles.studentId },
  }
  const idBubbleAsset = version.assets.find(
    (asset) => asset.assetType === 'IdBubbleFields',
  )

  if (idBubbleAsset?.jsonContent) {
    try {
      const fields = JSON.parse(idBubbleAsset.jsonContent) as unknown

      if (Array.isArray(fields)) {
        for (const field of fields) {
          if (!field || typeof field !== 'object') {
            continue
          }

          const fieldRecord = field as Record<string, unknown>
          const target =
            fieldRecord.id === 'field_1'
              ? result.studentId
              : fieldRecord.id === 'field_2'
                ? result.quizId
                : null

          if (!target) {
            continue
          }

          target.label = String(fieldRecord.label || target.label)
          target.n_cols = Number(fieldRecord.n_cols) || target.n_cols
          target.n_rows = Number(fieldRecord.n_rows) || target.n_rows
        }
      }
    } catch {
      // Fall back to metadata/defaults when an uploaded JSON asset is malformed.
    }
  }

  for (const field of version.metadataFields) {
    if (field.fieldCode === 'student_id') {
      result.studentId.label = field.label || result.studentId.label
    }

    if (field.fieldCode === 'quiz_id') {
      result.quizId.label = field.label || result.quizId.label
    }
  }

  return result
}

function createMetadataPayloadFromSettings(
  settings: TemplateSettings,
): UpsertPaperExamMetadataFieldRequest[] {
  return generateIdBubbleFields(settings).map((field) => ({
    decodeMode: 'bubble_grid',
    fieldCode: field.id === 'field_1' ? 'student_id' : 'quiz_id',
    geometryJson: JSON.stringify(field, null, 2),
    isRequired: true,
    label: field.label,
    validationPolicyJson: '{}',
  }))
}
