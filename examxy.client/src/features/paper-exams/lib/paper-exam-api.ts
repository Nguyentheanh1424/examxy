import { apiRequest } from '@/lib/http/api-client'
import { buildApiError, isApiError } from '@/lib/http/api-error'
import type {
  AssessmentPaperBinding,
  AssessmentScanSubmission,
  CreatePaperExamTemplateRequest,
  CreatePaperExamTemplateVersionRequest,
  PaperExamMetadataField,
  PaperExamTemplate,
  PaperExamTemplateAsset,
  PaperExamTemplateVersion,
  ReviewOfflineAssessmentScanRequest,
  StudentOfflineScanConfig,
  SubmitOfflineAssessmentScanRequest,
  UpdatePaperExamTemplateVersionRequest,
  UpsertAssessmentPaperBindingRequest,
  UpsertPaperExamMetadataFieldRequest,
  UploadPaperExamTemplateAssetRequest,
  ValidatePaperExamTemplateVersionResult,
} from '@/types/paper-exam'

const API_BASE_URL = (() => {
  const configuredBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '/api').trim()

  if (!configuredBaseUrl) {
    return '/api'
  }

  return configuredBaseUrl.endsWith('/')
    ? configuredBaseUrl.slice(0, -1)
    : configuredBaseUrl
})()

function buildApiUrl(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${normalizedPath}`
}

function getFileNameFromDisposition(
  contentDisposition: string | null,
  fallbackFileName: string,
) {
  if (!contentDisposition) {
    return fallbackFileName
  }

  const encodedMatch = /filename\*=UTF-8''([^;]+)/i.exec(contentDisposition)
  if (encodedMatch?.[1]) {
    return decodeURIComponent(encodedMatch[1])
  }

  const plainMatch = /filename="?([^"]+)"?/i.exec(contentDisposition)
  return plainMatch?.[1] ?? fallbackFileName
}

export function getPaperExamTemplatesRequest() {
  return apiRequest<PaperExamTemplate[]>('/paper-exam/templates', {
    auth: true,
  })
}

export function getPaperExamTemplateRequest(templateId: string) {
  return apiRequest<PaperExamTemplate>(`/paper-exam/templates/${templateId}`, {
    auth: true,
  })
}

export function createPaperExamTemplateRequest(
  request: CreatePaperExamTemplateRequest,
) {
  return apiRequest<PaperExamTemplate>('/paper-exam/templates', {
    auth: true,
    method: 'POST',
    body: request,
  })
}

export function createPaperExamTemplateVersionRequest(
  templateId: string,
  request: CreatePaperExamTemplateVersionRequest,
) {
  return apiRequest<PaperExamTemplateVersion>(
    `/paper-exam/templates/${templateId}/versions`,
    {
      auth: true,
      method: 'POST',
      body: request,
    },
  )
}

export function getPaperExamTemplateVersionRequest(
  templateId: string,
  versionId: string,
) {
  return apiRequest<PaperExamTemplateVersion>(
    `/paper-exam/templates/${templateId}/versions/${versionId}`,
    {
      auth: true,
    },
  )
}

export function updatePaperExamTemplateVersionRequest(
  templateId: string,
  versionId: string,
  request: UpdatePaperExamTemplateVersionRequest,
) {
  return apiRequest<PaperExamTemplateVersion>(
    `/paper-exam/templates/${templateId}/versions/${versionId}`,
    {
      auth: true,
      method: 'PUT',
      body: request,
    },
  )
}

export function uploadPaperExamTemplateAssetRequest(
  templateId: string,
  versionId: string,
  request: UploadPaperExamTemplateAssetRequest,
) {
  return apiRequest<PaperExamTemplateAsset>(
    `/paper-exam/templates/${templateId}/versions/${versionId}/assets`,
    {
      auth: true,
      method: 'POST',
      body: request,
    },
  )
}

export function upsertPaperExamMetadataFieldsRequest(
  templateId: string,
  versionId: string,
  request: UpsertPaperExamMetadataFieldRequest[],
) {
  return apiRequest<PaperExamMetadataField[]>(
    `/paper-exam/templates/${templateId}/versions/${versionId}/metadata-fields`,
    {
      auth: true,
      method: 'PUT',
      body: request,
    },
  )
}

export function validatePaperExamTemplateVersionRequest(
  templateId: string,
  versionId: string,
) {
  return apiRequest<ValidatePaperExamTemplateVersionResult>(
    `/paper-exam/templates/${templateId}/versions/${versionId}/validate`,
    {
      auth: true,
      method: 'POST',
    },
  )
}

export function publishPaperExamTemplateVersionRequest(
  templateId: string,
  versionId: string,
) {
  return apiRequest<PaperExamTemplateVersion>(
    `/paper-exam/templates/${templateId}/versions/${versionId}/publish`,
    {
      auth: true,
      method: 'POST',
    },
  )
}

export function clonePaperExamTemplateVersionRequest(
  templateId: string,
  versionId: string,
) {
  return apiRequest<PaperExamTemplateVersion>(
    `/paper-exam/templates/${templateId}/versions/${versionId}/clone`,
    {
      auth: true,
      method: 'POST',
    },
  )
}

export async function getAssessmentPaperBindingRequest(
  classId: string,
  assessmentId: string,
) {
  try {
    return await apiRequest<AssessmentPaperBinding>(
      `/classes/${classId}/assessments/${assessmentId}/paper-binding`,
      {
        auth: true,
      },
    )
  } catch (error) {
    if (isApiError(error) && error.statusCode === 404) {
      return null
    }

    throw error
  }
}

export function upsertAssessmentPaperBindingRequest(
  classId: string,
  assessmentId: string,
  request: UpsertAssessmentPaperBindingRequest,
) {
  return apiRequest<AssessmentPaperBinding>(
    `/classes/${classId}/assessments/${assessmentId}/paper-binding`,
    {
      auth: true,
      method: 'POST',
      body: request,
    },
  )
}

export function updateAssessmentPaperBindingRequest(
  classId: string,
  assessmentId: string,
  request: UpsertAssessmentPaperBindingRequest,
) {
  return apiRequest<AssessmentPaperBinding>(
    `/classes/${classId}/assessments/${assessmentId}/paper-binding`,
    {
      auth: true,
      method: 'PUT',
      body: request,
    },
  )
}

export function activateAssessmentPaperBindingRequest(
  classId: string,
  assessmentId: string,
) {
  return apiRequest<AssessmentPaperBinding>(
    `/classes/${classId}/assessments/${assessmentId}/paper-binding/activate`,
    {
      auth: true,
      method: 'POST',
    },
  )
}

export function getOfflineScanConfigRequest(classId: string, assessmentId: string) {
  return apiRequest<StudentOfflineScanConfig>(
    `/classes/${classId}/assessments/${assessmentId}/offline-scan-config`,
    {
      auth: true,
    },
  )
}

export function submitOfflineAssessmentScanRequest(
  classId: string,
  assessmentId: string,
  request: SubmitOfflineAssessmentScanRequest,
) {
  const formData = new FormData()
  formData.append('rawImage', request.rawImage)
  formData.append('bindingId', request.bindingId)
  formData.append('bindingVersionUsed', String(request.bindingVersionUsed))
  formData.append('configHashUsed', request.configHashUsed)
  formData.append('clientSchemaVersion', request.clientSchemaVersion)
  if (request.clientAppVersion) {
    formData.append('clientAppVersion', request.clientAppVersion)
  }
  formData.append('answersJson', JSON.stringify(request.answers))
  formData.append('metadataJson', request.metadataJson ?? '{}')
  formData.append('confidenceSummaryJson', request.confidenceSummaryJson ?? '{}')
  formData.append('warningFlagsJson', request.warningFlagsJson ?? '[]')
  formData.append('conflictFlagsJson', request.conflictFlagsJson ?? '[]')
  formData.append('rawScanPayloadJson', request.rawScanPayloadJson ?? '{}')

  return apiRequest<AssessmentScanSubmission>(
    `/classes/${classId}/assessments/${assessmentId}/offline-submissions`,
    {
      auth: true,
      method: 'POST',
      body: formData,
    },
  )
}

export async function getMyOfflineAssessmentSubmissionRequest(
  classId: string,
  assessmentId: string,
) {
  try {
    return await apiRequest<AssessmentScanSubmission>(
      `/classes/${classId}/assessments/${assessmentId}/offline-submissions/me`,
      {
        auth: true,
      },
    )
  } catch (error) {
    if (isApiError(error) && error.statusCode === 404) {
      return null
    }

    throw error
  }
}

export function getOfflineAssessmentSubmissionsRequest(
  classId: string,
  assessmentId: string,
) {
  return apiRequest<AssessmentScanSubmission[]>(
    `/classes/${classId}/assessments/${assessmentId}/offline-submissions`,
    {
      auth: true,
    },
  )
}

export function getOfflineAssessmentSubmissionRequest(
  classId: string,
  assessmentId: string,
  submissionId: string,
) {
  return apiRequest<AssessmentScanSubmission>(
    `/classes/${classId}/assessments/${assessmentId}/offline-submissions/${submissionId}`,
    {
      auth: true,
    },
  )
}

export function reviewOfflineAssessmentSubmissionRequest(
  classId: string,
  assessmentId: string,
  submissionId: string,
  request: ReviewOfflineAssessmentScanRequest,
) {
  return apiRequest<AssessmentScanSubmission>(
    `/classes/${classId}/assessments/${assessmentId}/offline-submissions/${submissionId}/review`,
    {
      auth: true,
      method: 'POST',
      body: request,
    },
  )
}

export function finalizeOfflineAssessmentSubmissionRequest(
  classId: string,
  assessmentId: string,
  submissionId: string,
) {
  return apiRequest<AssessmentScanSubmission>(
    `/classes/${classId}/assessments/${assessmentId}/offline-submissions/${submissionId}/finalize`,
    {
      auth: true,
      method: 'POST',
    },
  )
}

export async function downloadOfflineAssessmentArtifactRequest(
  accessToken: string,
  classId: string,
  assessmentId: string,
  submissionId: string,
  artifactId: string,
) {
  const response = await fetch(
    buildApiUrl(
      `/classes/${classId}/assessments/${assessmentId}/offline-submissions/${submissionId}/artifacts/${artifactId}`,
    ),
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  )

  if (!response.ok) {
    throw await buildApiError(response)
  }

  const blob = await response.blob()
  const objectUrl = window.URL.createObjectURL(blob)
  const fileName = getFileNameFromDisposition(
    response.headers.get('content-disposition'),
    `${artifactId}.bin`,
  )

  const link = document.createElement('a')
  link.href = objectUrl
  link.download = fileName
  document.body.append(link)
  link.click()
  link.remove()

  window.setTimeout(() => {
    window.URL.revokeObjectURL(objectUrl)
  }, 0)
}
