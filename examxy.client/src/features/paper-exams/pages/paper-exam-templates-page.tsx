import type { ChangeEvent, FormEvent } from 'react'
import {
  CheckCircle2,
  Copy,
  Layers3,
  PlusCircle,
  RefreshCcw,
  Upload,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { CardShell } from '@/components/ui/card-shell'
import { CheckboxField } from '@/components/ui/checkbox-field'
import { Notice } from '@/components/ui/notice'
import { Spinner } from '@/components/ui/spinner'
import { TextField } from '@/components/ui/text-field'
import { TextareaField } from '@/components/ui/textarea-field'
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
import { getErrorMessage } from '@/lib/http/api-error'
import type {
  CreatePaperExamTemplateRequest,
  CreatePaperExamTemplateVersionRequest,
  PaperExamMetadataField,
  PaperExamTemplate,
  PaperExamTemplateVersion,
  UpsertPaperExamMetadataFieldRequest,
  ValidatePaperExamTemplateVersionResult,
} from '@/types/paper-exam'

interface TemplateDraftState {
  code: string
  name: string
  description: string
  paperSize: string
  markerScheme: string
  outputWidth: string
  outputHeight: string
  hasStudentIdField: boolean
  hasQuizIdField: boolean
  hasHandwrittenRegions: boolean
}

interface VersionDraftState {
  schemaVersion: string
  questionCount: string
  optionsPerQuestion: string
  absThreshold: string
  relThreshold: string
  scoringMethod: string
  scoringParamsJson: string
  payloadSchemaVersion: string
  minClientAppVersion: string
}

interface MetadataFieldDraftState {
  fieldCode: string
  label: string
  decodeMode: string
  isRequired: boolean
  geometryJson: string
  validationPolicyJson: string
}

type JsonAssetType =
  | 'MarkerLayout'
  | 'CircleRois'
  | 'IdBubbleFields'
  | 'RegionWindows'

const jsonAssetTypes: JsonAssetType[] = [
  'MarkerLayout',
  'CircleRois',
  'IdBubbleFields',
  'RegionWindows',
]

const emptyTemplateDraft: TemplateDraftState = {
  code: '',
  name: '',
  description: '',
  paperSize: 'A4',
  markerScheme: 'custom',
  outputWidth: '',
  outputHeight: '',
  hasStudentIdField: true,
  hasQuizIdField: true,
  hasHandwrittenRegions: false,
}

const emptyVersionDraft: VersionDraftState = {
  schemaVersion: '1.0',
  questionCount: '1',
  optionsPerQuestion: '4',
  absThreshold: '0.7',
  relThreshold: '0.25',
  scoringMethod: 'annulus_patch_darkness',
  scoringParamsJson: '{}',
  payloadSchemaVersion: '1.0',
  minClientAppVersion: '',
}

const emptyMetadataFieldDraft: MetadataFieldDraftState = {
  fieldCode: '',
  label: '',
  decodeMode: 'bubble_grid',
  isRequired: false,
  geometryJson: '{}',
  validationPolicyJson: '{}',
}

const emptyJsonAssetDrafts: Record<JsonAssetType, string> = {
  MarkerLayout: '',
  CircleRois: '',
  IdBubbleFields: '',
  RegionWindows: '',
}

function formatUtcDate(value: string | null) {
  if (!value) return 'Not published'
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function toCreateTemplateRequest(
  state: TemplateDraftState,
): CreatePaperExamTemplateRequest {
  return {
    code: state.code.trim(),
    name: state.name.trim(),
    description: state.description.trim(),
    paperSize: state.paperSize.trim() || 'A4',
    outputWidth: state.outputWidth ? Number(state.outputWidth) : null,
    outputHeight: state.outputHeight ? Number(state.outputHeight) : null,
    markerScheme: state.markerScheme.trim() || 'custom',
    hasStudentIdField: state.hasStudentIdField,
    hasQuizIdField: state.hasQuizIdField,
    hasHandwrittenRegions: state.hasHandwrittenRegions,
  }
}

function toVersionRequest(
  state: VersionDraftState,
): CreatePaperExamTemplateVersionRequest {
  return {
    schemaVersion: state.schemaVersion.trim() || '1.0',
    questionCount: Number(state.questionCount) || 1,
    optionsPerQuestion: Number(state.optionsPerQuestion) || 4,
    absThreshold: Number(state.absThreshold) || 0.7,
    relThreshold: Number(state.relThreshold) || 0.25,
    scoringMethod: state.scoringMethod.trim() || 'annulus_patch_darkness',
    scoringParamsJson: state.scoringParamsJson || '{}',
    payloadSchemaVersion: state.payloadSchemaVersion.trim() || '1.0',
    minClientAppVersion: state.minClientAppVersion.trim() || null,
  }
}

function toVersionDraftState(version: PaperExamTemplateVersion): VersionDraftState {
  return {
    schemaVersion: version.schemaVersion,
    questionCount: String(version.questionCount),
    optionsPerQuestion: String(version.optionsPerQuestion),
    absThreshold: String(version.absThreshold),
    relThreshold: String(version.relThreshold),
    scoringMethod: version.scoringMethod,
    scoringParamsJson: version.scoringParamsJson,
    payloadSchemaVersion: version.payloadSchemaVersion,
    minClientAppVersion: version.minClientAppVersion ?? '',
  }
}

function toMetadataFieldDraftState(
  field: PaperExamMetadataField,
): MetadataFieldDraftState {
  return {
    fieldCode: field.fieldCode,
    label: field.label,
    decodeMode: field.decodeMode,
    isRequired: field.isRequired,
    geometryJson: field.geometryJson,
    validationPolicyJson: field.validationPolicyJson,
  }
}

function getAssetByType(
  version: PaperExamTemplateVersion | null,
  assetType: string,
) {
  return version?.assets.find((asset) => asset.assetType === assetType) ?? null
}

function createJsonAssetDrafts(version: PaperExamTemplateVersion | null) {
  return {
    MarkerLayout: getAssetByType(version, 'MarkerLayout')?.jsonContent ?? '',
    CircleRois: getAssetByType(version, 'CircleRois')?.jsonContent ?? '',
    IdBubbleFields: getAssetByType(version, 'IdBubbleFields')?.jsonContent ?? '',
    RegionWindows: getAssetByType(version, 'RegionWindows')?.jsonContent ?? '',
  }
}

function createMetadataDrafts(version: PaperExamTemplateVersion | null) {
  return version?.metadataFields.length
    ? version.metadataFields.map(toMetadataFieldDraftState)
    : []
}

async function fileToBase64(file: File) {
  const bytes = await file.arrayBuffer()
  let binary = ''
  const view = new Uint8Array(bytes)

  for (const byte of view) {
    binary += String.fromCharCode(byte)
  }

  return window.btoa(binary)
}

function updateSearchSelection(
  setSearchParams: ReturnType<typeof useSearchParams>[1],
  templateId: string | null,
  versionId?: string | null,
) {
  const nextParams = new URLSearchParams()

  if (templateId) {
    nextParams.set('templateId', templateId)
  }

  if (versionId) {
    nextParams.set('versionId', versionId)
  }

  setSearchParams(nextParams, { replace: true })
}

export function PaperExamTemplatesPage() {
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

  async function loadTemplates() {
    const response = await getPaperExamTemplatesRequest()
    setTemplates(response)
    return response
  }

  async function loadTemplateDetail(templateId: string) {
    setIsTemplateLoading(true)

    try {
      const response = await getPaperExamTemplateRequest(templateId)
      setSelectedTemplate(response)
      return response
    } finally {
      setIsTemplateLoading(false)
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
      setSelectedTemplate(null)
      return
    }

    void (async () => {
      try {
        await loadTemplateDetail(selectedTemplateId)
      } catch (nextError) {
        setNotice({
          tone: 'error',
          title: 'Unable to load template details',
          message: getErrorMessage(
            nextError,
            'The selected template could not be loaded.',
          ),
        })
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
  }, [selectedVersion])

  async function handleCreateTemplate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusyKey('create-template')
    setNotice(null)

    try {
      const created = await createPaperExamTemplateRequest(
        toCreateTemplateRequest(templateDraft),
      )
      setTemplateDraft(emptyTemplateDraft)
      setSelectedTemplate(created)
      await refreshWorkspace(created.id, created.versions[0]?.id ?? null)
      setNotice({
        tone: 'success',
        title: 'Template created',
        message: 'You can now create a draft version in the workspace.',
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
      setValidationResult(result)
      await refreshWorkspace(selectedTemplate.id, selectedVersion.id)
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

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-full border border-line bg-surface px-5 py-3 text-sm font-medium text-muted shadow-sm">
          <Spinner />
          Loading paper-exam templates...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <CardShell className="p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-strong">
              Offline paper exam
            </p>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-4xl">
                Template workspace
              </h1>
              <p className="max-w-3xl text-base leading-7 text-muted">
                Manage template families, draft version clones, validation, and
                publish state for the teacher paper-exam workflow.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to="/teacher/dashboard">
              <Button variant="secondary">Back to dashboard</Button>
            </Link>
            <Button
              leftIcon={<RefreshCcw className="size-4" />}
              onClick={() => {
                void refreshWorkspace()
              }}
              variant="secondary"
            >
              Refresh
            </Button>
          </div>
        </div>
      </CardShell>

      {notice ? (
        <Notice tone={notice.tone} title={notice.title}>
          {notice.message}
        </Notice>
      ) : null}

      {error ? (
        <Notice tone="error" title="Unable to load template workspace">
          {error}
        </Notice>
      ) : null}

      <CardShell className="p-6 sm:p-8">
        <form className="space-y-4" onSubmit={handleCreateTemplate}>
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-strong">
              Create template
            </p>
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-ink">
              Bootstrap a paper-sheet family
            </h2>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <TextField
              label="Code"
              onChange={(event) =>
                setTemplateDraft((current) => ({
                  ...current,
                  code: event.target.value,
                }))
              }
              value={templateDraft.code}
            />
            <TextField
              label="Name"
              onChange={(event) =>
                setTemplateDraft((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              value={templateDraft.name}
            />
            <TextField
              label="Paper size"
              onChange={(event) =>
                setTemplateDraft((current) => ({
                  ...current,
                  paperSize: event.target.value,
                }))
              }
              value={templateDraft.paperSize}
            />
            <TextField
              label="Marker scheme"
              onChange={(event) =>
                setTemplateDraft((current) => ({
                  ...current,
                  markerScheme: event.target.value,
                }))
              }
              value={templateDraft.markerScheme}
            />
            <TextField
              label="Output width"
              onChange={(event) =>
                setTemplateDraft((current) => ({
                  ...current,
                  outputWidth: event.target.value,
                }))
              }
              type="number"
              value={templateDraft.outputWidth}
            />
            <TextField
              label="Output height"
              onChange={(event) =>
                setTemplateDraft((current) => ({
                  ...current,
                  outputHeight: event.target.value,
                }))
              }
              type="number"
              value={templateDraft.outputHeight}
            />
          </div>

          <TextareaField
            label="Description"
            onChange={(event) =>
              setTemplateDraft((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
            rows={3}
            value={templateDraft.description}
          />

          <div className="grid gap-3 sm:grid-cols-3">
            <CheckboxField
              checked={templateDraft.hasStudentIdField}
              label="Student ID field"
              onChange={(event) =>
                setTemplateDraft((current) => ({
                  ...current,
                  hasStudentIdField: event.target.checked,
                }))
              }
            />
            <CheckboxField
              checked={templateDraft.hasQuizIdField}
              label="Quiz ID field"
              onChange={(event) =>
                setTemplateDraft((current) => ({
                  ...current,
                  hasQuizIdField: event.target.checked,
                }))
              }
            />
            <CheckboxField
              checked={templateDraft.hasHandwrittenRegions}
              label="Handwritten regions"
              onChange={(event) =>
                setTemplateDraft((current) => ({
                  ...current,
                  hasHandwrittenRegions: event.target.checked,
                }))
              }
            />
          </div>

          <Button
            isLoading={busyKey === 'create-template'}
            leftIcon={<PlusCircle className="size-4" />}
            type="submit"
          >
            Create template
          </Button>
        </form>
      </CardShell>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1fr_1.25fr]">
        <CardShell className="p-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-strong">
                Template catalog
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-ink">
                Select a family
              </h2>
            </div>

            {templates.length === 0 ? (
              <p className="text-sm leading-6 text-muted">
                No templates exist yet. Create the first paper-sheet family above.
              </p>
            ) : (
              <div className="space-y-3">
                {templates.map((template) => {
                  const isSelected = template.id === selectedTemplateId

                  return (
                    <button
                      className={`w-full rounded-3xl border px-4 py-4 text-left transition ${
                        isSelected
                          ? 'border-brand bg-brand-soft/60'
                          : 'border-line bg-surface hover:border-brand/25'
                      }`}
                      key={template.id}
                      onClick={() => {
                        updateSearchSelection(
                          setSearchParams,
                          template.id,
                          template.versions[0]?.id ?? null,
                        )
                      }}
                      type="button"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            <span className="rounded-full bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-strong">
                              {template.code}
                            </span>
                            <span className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-muted">
                              {template.status}
                            </span>
                          </div>
                          <p className="text-lg font-semibold text-ink">{template.name}</p>
                          <p className="text-sm leading-6 text-muted">
                            {template.description || 'No description.'}
                          </p>
                        </div>
                        {isSelected ? (
                          <CheckCircle2 className="mt-1 size-5 text-brand-strong" />
                        ) : null}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </CardShell>

        <CardShell className="p-6">
          <div className="space-y-5">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-strong">
                Version catalog
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-ink">
                Drafts and published versions
              </h2>
            </div>

            {isTemplateLoading ? (
              <div className="flex items-center gap-3 rounded-3xl border border-line bg-surface px-4 py-3 text-sm text-muted">
                <Spinner />
                Loading template details...
              </div>
            ) : null}

            {selectedTemplate ? (
              <>
                <div className="rounded-3xl border border-line bg-surface p-4">
                  <p className="text-sm font-semibold text-ink">
                    {selectedTemplate.code} - {selectedTemplate.name}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    {selectedTemplate.description || 'No description.'}
                  </p>
                </div>

                <div className="space-y-3">
                  {selectedTemplate.versions.length === 0 ? (
                    <p className="text-sm leading-6 text-muted">
                      This template does not have a version yet. Create a blank draft
                      below.
                    </p>
                  ) : null}

                  {selectedTemplate.versions.map((version) => {
                    const isSelected = version.id === selectedVersionId

                    return (
                      <button
                        className={`w-full rounded-3xl border px-4 py-4 text-left transition ${
                          isSelected
                            ? 'border-brand bg-brand-soft/60'
                            : 'border-line bg-panel hover:border-brand/25'
                        }`}
                        key={version.id}
                        onClick={() => {
                          updateSearchSelection(
                            setSearchParams,
                            selectedTemplate.id,
                            version.id,
                          )
                        }}
                        type="button"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-2">
                            <p className="text-base font-semibold text-ink">
                              Version {version.versionNumber} - {version.status}
                            </p>
                            <p className="text-sm leading-6 text-muted">
                              Schema {version.schemaVersion} - Questions{' '}
                              {version.questionCount} - Options{' '}
                              {version.optionsPerQuestion}
                              <br />
                              Published {formatUtcDate(version.publishedAtUtc)}
                            </p>
                          </div>
                          {isSelected ? (
                            <CheckCircle2 className="mt-1 size-5 text-brand-strong" />
                          ) : null}
                        </div>
                      </button>
                    )
                  })}
                </div>

                <div className="space-y-4 rounded-3xl border border-line bg-panel p-4">
                  <p className="text-sm font-semibold text-ink">Create blank draft</p>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <TextField
                      label="Schema version"
                      onChange={(event) =>
                        setNewVersionDraft((current) => ({
                          ...current,
                          schemaVersion: event.target.value,
                        }))
                      }
                      value={newVersionDraft.schemaVersion}
                    />
                    <TextField
                      label="Payload schema version"
                      onChange={(event) =>
                        setNewVersionDraft((current) => ({
                          ...current,
                          payloadSchemaVersion: event.target.value,
                        }))
                      }
                      value={newVersionDraft.payloadSchemaVersion}
                    />
                    <TextField
                      label="Question count"
                      onChange={(event) =>
                        setNewVersionDraft((current) => ({
                          ...current,
                          questionCount: event.target.value,
                        }))
                      }
                      type="number"
                      value={newVersionDraft.questionCount}
                    />
                    <TextField
                      label="Options per question"
                      onChange={(event) =>
                        setNewVersionDraft((current) => ({
                          ...current,
                          optionsPerQuestion: event.target.value,
                        }))
                      }
                      type="number"
                      value={newVersionDraft.optionsPerQuestion}
                    />
                    <TextField
                      label="Abs threshold"
                      onChange={(event) =>
                        setNewVersionDraft((current) => ({
                          ...current,
                          absThreshold: event.target.value,
                        }))
                      }
                      value={newVersionDraft.absThreshold}
                    />
                    <TextField
                      label="Rel threshold"
                      onChange={(event) =>
                        setNewVersionDraft((current) => ({
                          ...current,
                          relThreshold: event.target.value,
                        }))
                      }
                      value={newVersionDraft.relThreshold}
                    />
                    <TextField
                      label="Scoring method"
                      onChange={(event) =>
                        setNewVersionDraft((current) => ({
                          ...current,
                          scoringMethod: event.target.value,
                        }))
                      }
                      value={newVersionDraft.scoringMethod}
                    />
                    <TextField
                      label="Min client version"
                      onChange={(event) =>
                        setNewVersionDraft((current) => ({
                          ...current,
                          minClientAppVersion: event.target.value,
                        }))
                      }
                      value={newVersionDraft.minClientAppVersion}
                    />
                  </div>

                  <TextareaField
                    label="Scoring params JSON"
                    onChange={(event) =>
                      setNewVersionDraft((current) => ({
                        ...current,
                        scoringParamsJson: event.target.value,
                      }))
                    }
                    rows={4}
                    value={newVersionDraft.scoringParamsJson}
                  />

                  <Button
                    isLoading={busyKey === 'create-version'}
                    leftIcon={<PlusCircle className="size-4" />}
                    onClick={() => {
                      void handleCreateVersion()
                    }}
                  >
                    Create blank draft
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-sm leading-6 text-muted">
                Select a template to manage its versions.
              </p>
            )}
          </div>
        </CardShell>

        <CardShell className="p-6">
          <div className="space-y-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-strong">
                  Version editor
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-ink">
                  Draft assets and publish state
                </h2>
              </div>

              {selectedVersion ? (
                <Button
                  isLoading={busyKey === 'clone-version'}
                  leftIcon={<Copy className="size-4" />}
                  onClick={() => {
                    void handleCloneVersion()
                  }}
                  variant="secondary"
                >
                  Clone to draft
                </Button>
              ) : null}
            </div>

            {!selectedVersion ? (
              <p className="text-sm leading-6 text-muted">
                Select a version to edit, validate, or publish it.
              </p>
            ) : (
              <>
                <div className="rounded-3xl border border-line bg-surface p-4">
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-base font-semibold text-ink">
                        Version {selectedVersion.versionNumber} - {selectedVersion.status}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        Geometry hash:{' '}
                        {selectedVersion.geometryConfigHash || 'Not computed yet'}
                      </p>
                    </div>
                    <span className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-muted">
                      Published {formatUtcDate(selectedVersion.publishedAtUtc)}
                    </span>
                  </div>
                </div>

                {selectedVersionIsPublished ? (
                  <Notice tone="success" title="Published versions are read-only">
                    Clone this version to a draft before editing fields, assets, or
                    metadata.
                  </Notice>
                ) : null}

                <div className="space-y-4 rounded-3xl border border-line bg-panel p-4">
                  <p className="text-sm font-semibold text-ink">Core settings</p>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <TextField
                      disabled={selectedVersionIsPublished}
                      label="Schema version"
                      onChange={(event) =>
                        setEditorDraft((current) => ({
                          ...current,
                          schemaVersion: event.target.value,
                        }))
                      }
                      value={editorDraft.schemaVersion}
                    />
                    <TextField
                      disabled={selectedVersionIsPublished}
                      label="Payload schema version"
                      onChange={(event) =>
                        setEditorDraft((current) => ({
                          ...current,
                          payloadSchemaVersion: event.target.value,
                        }))
                      }
                      value={editorDraft.payloadSchemaVersion}
                    />
                    <TextField
                      disabled={selectedVersionIsPublished}
                      label="Question count"
                      onChange={(event) =>
                        setEditorDraft((current) => ({
                          ...current,
                          questionCount: event.target.value,
                        }))
                      }
                      type="number"
                      value={editorDraft.questionCount}
                    />
                    <TextField
                      disabled={selectedVersionIsPublished}
                      label="Options per question"
                      onChange={(event) =>
                        setEditorDraft((current) => ({
                          ...current,
                          optionsPerQuestion: event.target.value,
                        }))
                      }
                      type="number"
                      value={editorDraft.optionsPerQuestion}
                    />
                    <TextField
                      disabled={selectedVersionIsPublished}
                      label="Abs threshold"
                      onChange={(event) =>
                        setEditorDraft((current) => ({
                          ...current,
                          absThreshold: event.target.value,
                        }))
                      }
                      value={editorDraft.absThreshold}
                    />
                    <TextField
                      disabled={selectedVersionIsPublished}
                      label="Rel threshold"
                      onChange={(event) =>
                        setEditorDraft((current) => ({
                          ...current,
                          relThreshold: event.target.value,
                        }))
                      }
                      value={editorDraft.relThreshold}
                    />
                    <TextField
                      disabled={selectedVersionIsPublished}
                      label="Scoring method"
                      onChange={(event) =>
                        setEditorDraft((current) => ({
                          ...current,
                          scoringMethod: event.target.value,
                        }))
                      }
                      value={editorDraft.scoringMethod}
                    />
                    <TextField
                      disabled={selectedVersionIsPublished}
                      label="Min client version"
                      onChange={(event) =>
                        setEditorDraft((current) => ({
                          ...current,
                          minClientAppVersion: event.target.value,
                        }))
                      }
                      value={editorDraft.minClientAppVersion}
                    />
                  </div>

                  <TextareaField
                    disabled={selectedVersionIsPublished}
                    label="Scoring params JSON"
                    onChange={(event) =>
                      setEditorDraft((current) => ({
                        ...current,
                        scoringParamsJson: event.target.value,
                      }))
                    }
                    rows={4}
                    value={editorDraft.scoringParamsJson}
                  />

                  <Button
                    disabled={selectedVersionIsPublished}
                    isLoading={busyKey === 'save-version'}
                    onClick={() => {
                      void handleSaveVersion()
                    }}
                  >
                    Save version fields
                  </Button>
                </div>

                <div className="space-y-4 rounded-3xl border border-line bg-panel p-4">
                  <p className="text-sm font-semibold text-ink">Template assets</p>

                  <div className="space-y-3 rounded-3xl border border-line bg-surface p-4">
                    <div className="space-y-1">
                      <p className="text-base font-medium text-ink">TemplateImage</p>
                      <p className="text-sm text-muted">
                        Current hash:{' '}
                        {selectedTemplateImageAsset?.contentHash || 'Not uploaded'}
                      </p>
                    </div>

                    <label className="block text-base font-medium text-ink" htmlFor="template-image-upload">
                      Upload image file
                    </label>
                    <input
                      className="block w-full rounded-[var(--radius-input)] border border-line bg-surface px-4 py-3 text-base text-ink"
                      disabled={selectedVersionIsPublished}
                      id="template-image-upload"
                      onChange={handleTemplateImageChange}
                      type="file"
                    />

                    <Button
                      disabled={selectedVersionIsPublished || !templateImageFile}
                      isLoading={busyKey === 'upload-template-image'}
                      leftIcon={<Upload className="size-4" />}
                      onClick={() => {
                        void handleUploadTemplateImage()
                      }}
                      variant="secondary"
                    >
                      Upload template image
                    </Button>
                  </div>

                  <div className="grid gap-4">
                    {jsonAssetTypes.map((assetType) => {
                      const existingAsset = getAssetByType(selectedVersion, assetType)

                      return (
                        <TextareaField
                          disabled={selectedVersionIsPublished}
                          hint={`Current hash: ${existingAsset?.contentHash || 'Not uploaded'}`}
                          key={assetType}
                          label={`${assetType} JSON`}
                          onChange={(event) =>
                            setJsonAssetDrafts((current) => ({
                              ...current,
                              [assetType]: event.target.value,
                            }))
                          }
                          rows={5}
                          value={jsonAssetDrafts[assetType]}
                        />
                      )
                    })}
                  </div>

                  <Button
                    disabled={selectedVersionIsPublished}
                    isLoading={busyKey === 'save-json-assets'}
                    onClick={() => {
                      void handleSaveJsonAssets()
                    }}
                    variant="secondary"
                  >
                    Save JSON assets
                  </Button>
                </div>

                <div className="space-y-4 rounded-3xl border border-line bg-panel p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-ink">Metadata fields</p>
                    <Button
                      disabled={selectedVersionIsPublished}
                      onClick={() => {
                        setMetadataFieldDrafts((current) => [
                          ...current,
                          { ...emptyMetadataFieldDraft },
                        ])
                      }}
                      size="md"
                      variant="secondary"
                    >
                      Add metadata field
                    </Button>
                  </div>

                  {metadataFieldDrafts.length === 0 ? (
                    <p className="text-sm leading-6 text-muted">
                      No metadata fields configured yet.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {metadataFieldDrafts.map((field, index) => (
                        <div
                          className="rounded-3xl border border-line bg-surface p-4"
                          key={`${field.fieldCode || 'field'}-${index}`}
                        >
                          <div className="grid gap-4 lg:grid-cols-2">
                            <TextField
                              disabled={selectedVersionIsPublished}
                              label="Field code"
                              onChange={(event) =>
                                setMetadataFieldDrafts((current) =>
                                  current.map((candidate, candidateIndex) =>
                                    candidateIndex === index
                                      ? {
                                          ...candidate,
                                          fieldCode: event.target.value,
                                        }
                                      : candidate,
                                  ),
                                )
                              }
                              value={field.fieldCode}
                            />
                            <TextField
                              disabled={selectedVersionIsPublished}
                              label="Label"
                              onChange={(event) =>
                                setMetadataFieldDrafts((current) =>
                                  current.map((candidate, candidateIndex) =>
                                    candidateIndex === index
                                      ? { ...candidate, label: event.target.value }
                                      : candidate,
                                  ),
                                )
                              }
                              value={field.label}
                            />
                            <TextField
                              disabled={selectedVersionIsPublished}
                              label="Decode mode"
                              onChange={(event) =>
                                setMetadataFieldDrafts((current) =>
                                  current.map((candidate, candidateIndex) =>
                                    candidateIndex === index
                                      ? {
                                          ...candidate,
                                          decodeMode: event.target.value,
                                        }
                                      : candidate,
                                  ),
                                )
                              }
                              value={field.decodeMode}
                            />
                            <CheckboxField
                              checked={field.isRequired}
                              label="Required field"
                              onChange={(event) =>
                                setMetadataFieldDrafts((current) =>
                                  current.map((candidate, candidateIndex) =>
                                    candidateIndex === index
                                      ? {
                                          ...candidate,
                                          isRequired: event.target.checked,
                                        }
                                      : candidate,
                                  ),
                                )
                              }
                            />
                          </div>

                          <div className="mt-4 grid gap-4">
                            <TextareaField
                              disabled={selectedVersionIsPublished}
                              label="Geometry JSON"
                              onChange={(event) =>
                                setMetadataFieldDrafts((current) =>
                                  current.map((candidate, candidateIndex) =>
                                    candidateIndex === index
                                      ? {
                                          ...candidate,
                                          geometryJson: event.target.value,
                                        }
                                      : candidate,
                                  ),
                                )
                              }
                              rows={4}
                              value={field.geometryJson}
                            />
                            <TextareaField
                              disabled={selectedVersionIsPublished}
                              label="Validation policy JSON"
                              onChange={(event) =>
                                setMetadataFieldDrafts((current) =>
                                  current.map((candidate, candidateIndex) =>
                                    candidateIndex === index
                                      ? {
                                          ...candidate,
                                          validationPolicyJson:
                                            event.target.value,
                                        }
                                      : candidate,
                                  ),
                                )
                              }
                              rows={4}
                              value={field.validationPolicyJson}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <Button
                    disabled={selectedVersionIsPublished}
                    isLoading={busyKey === 'save-metadata'}
                    onClick={() => {
                      void handleSaveMetadataFields()
                    }}
                    variant="secondary"
                  >
                    Save metadata fields
                  </Button>
                </div>

                <div className="space-y-4 rounded-3xl border border-line bg-panel p-4">
                  <div className="flex flex-wrap gap-3">
                    <Button
                      disabled={selectedVersionIsPublished}
                      isLoading={busyKey === 'validate-version'}
                      leftIcon={<Layers3 className="size-4" />}
                      onClick={() => {
                        void handleValidateVersion()
                      }}
                      variant="secondary"
                    >
                      Validate version
                    </Button>
                    <Button
                      disabled={selectedVersionIsPublished}
                      isLoading={busyKey === 'publish-version'}
                      leftIcon={<CheckCircle2 className="size-4" />}
                      onClick={() => {
                        void handlePublishVersion()
                      }}
                    >
                      Publish version
                    </Button>
                  </div>

                  {validationResult ? (
                    <div className="rounded-3xl border border-line bg-surface p-4">
                      <p className="text-base font-semibold text-ink">
                        Validation result: {validationResult.isValid ? 'Valid' : 'Invalid'}
                      </p>
                      <p className="mt-2 text-sm text-muted">
                        Geometry hash: {validationResult.geometryConfigHash || 'Not computed'}
                      </p>

                      {validationResult.errors.length > 0 ? (
                        <div className="mt-4 space-y-2">
                          <p className="text-sm font-semibold text-danger">Errors</p>
                          <ul className="list-disc space-y-1 pl-5 text-sm text-danger">
                            {validationResult.errors.map((errorItem) => (
                              <li key={errorItem}>{errorItem}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      {validationResult.warnings.length > 0 ? (
                        <div className="mt-4 space-y-2">
                          <p className="text-sm font-semibold text-ink">Warnings</p>
                          <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
                            {validationResult.warnings.map((warning) => (
                              <li key={warning}>{warning}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </>
            )}
          </div>
        </CardShell>
      </div>
    </div>
  )
}
