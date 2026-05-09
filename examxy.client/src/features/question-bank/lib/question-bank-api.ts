import { apiRequest } from '@/lib/http/api-client'
import type {
  CompleteQuestionBankAttachmentUploadRequest,
  CreateQuestionBankAttachmentUploadUrlRequest,
  CreateQuestionBankAttachmentUploadUrlResponse,
  CreateQuestionBankExportRequest,
  CreateQuestionRequest,
  QuestionAttachment,
  Question,
  QuestionBankCapabilities,
  QuestionBankExportJob,
  QuestionImportPreviewRequest,
  QuestionImportPreviewResponse,
  QuestionBankSearchQuery,
  QuestionBankSearchResult,
  QuestionLatexPreviewRequest,
  QuestionLatexPreviewResponse,
  QuestionVersion,
  UpdateQuestionRequest,
} from '@/types/question-bank'

export function getQuestionsRequest() {
  return apiRequest<Question[]>('/question-bank/questions', {
    auth: true,
  })
}

export function searchQuestionsRequest(query: QuestionBankSearchQuery) {
  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value))
    }
  })

  const suffix = params.toString() ? `?${params.toString()}` : ''
  return apiRequest<QuestionBankSearchResult>(`/question-bank/questions/search${suffix}`, {
    auth: true,
  })
}

export function getQuestionBankCapabilitiesRequest() {
  return apiRequest<QuestionBankCapabilities>('/question-bank/capabilities', {
    auth: true,
  })
}

export function getQuestionRequest(questionId: string) {
  return apiRequest<Question>(`/question-bank/questions/${questionId}`, {
    auth: true,
  })
}

export function getQuestionVersionsRequest(questionId: string) {
  return apiRequest<QuestionVersion[]>(`/question-bank/questions/${questionId}/versions`, {
    auth: true,
  })
}

export function getQuestionVersionRequest(questionId: string, versionNumber: number) {
  return apiRequest<QuestionVersion>(
    `/question-bank/questions/${questionId}/versions/${versionNumber}`,
    {
      auth: true,
    },
  )
}

export function createQuestionRequest(request: CreateQuestionRequest) {
  return apiRequest<Question>('/question-bank/questions', {
    auth: true,
    method: 'POST',
    body: request,
  })
}

export function updateQuestionRequest(
  questionId: string,
  request: UpdateQuestionRequest,
) {
  return apiRequest<Question>(`/question-bank/questions/${questionId}`, {
    auth: true,
    method: 'PUT',
    body: request,
  })
}

export function deleteQuestionPermanentlyRequest(questionId: string) {
  return apiRequest<void>(`/question-bank/questions/${questionId}`, {
    auth: true,
    method: 'DELETE',
  })
}

/**
 * @deprecated Use deleteQuestionPermanentlyRequest or archiveQuestionRequest instead.
 */
export function deleteQuestionRequest(questionId: string) {
  return deleteQuestionPermanentlyRequest(questionId)
}

export function archiveQuestionRequest(
  questionId: string,
  request: UpdateQuestionRequest,
) {
  return apiRequest<Question>(`/question-bank/questions/${questionId}`, {
    auth: true,
    method: 'PUT',
    body: {
      ...request,
      status: 'Archived',
    },
  })
}

export function restoreQuestionRequest(
  questionId: string,
  request: UpdateQuestionRequest,
) {
  return apiRequest<Question>(`/question-bank/questions/${questionId}`, {
    auth: true,
    method: 'PUT',
    body: {
      ...request,
      status: 'Active',
    },
  })
}

export function previewQuestionLatexRequest(request: QuestionLatexPreviewRequest) {
  return apiRequest<QuestionLatexPreviewResponse>('/question-bank/questions/preview/latex', {
    auth: true,
    method: 'POST',
    body: request,
  })
}

export function previewQuestionImportRequest(request: QuestionImportPreviewRequest) {
  return apiRequest<QuestionImportPreviewResponse>('/question-bank/questions/import/preview', {
    auth: true,
    method: 'POST',
    body: request,
  })
}

export function createQuestionBankPdfExportRequest(request: CreateQuestionBankExportRequest) {
  return apiRequest<QuestionBankExportJob>('/question-bank/exports/pdf', {
    auth: true,
    method: 'POST',
    body: request,
  })
}

export function getQuestionBankExportRequest(exportJobId: string) {
  return apiRequest<QuestionBankExportJob>(`/question-bank/exports/${exportJobId}`, {
    auth: true,
  })
}

export function getQuestionBankExportFileDownloadUrl(
  exportJobId: string,
  fileId: string,
) {
  return `/api/question-bank/exports/${exportJobId}/files/${fileId}/download`
}

export function createQuestionBankAttachmentUploadUrlRequest(
  request: CreateQuestionBankAttachmentUploadUrlRequest,
) {
  return apiRequest<CreateQuestionBankAttachmentUploadUrlResponse>('/question-bank/attachments/upload-url', {
    auth: true,
    method: 'POST',
    body: request,
  })
}

export function completeQuestionBankAttachmentUploadRequest(
  request: CompleteQuestionBankAttachmentUploadRequest,
) {
  return apiRequest<QuestionAttachment>('/question-bank/attachments/complete', {
    auth: true,
    method: 'POST',
    body: request,
  })
}

export function getQuestionBankAttachmentRequest(attachmentId: string) {
  return apiRequest<QuestionAttachment>(`/question-bank/attachments/${attachmentId}`, {
    auth: true,
  })
}

export function deleteQuestionBankAttachmentRequest(attachmentId: string) {
  return apiRequest<void>(`/question-bank/attachments/${attachmentId}`, {
    auth: true,
    method: 'DELETE',
  })
}

export function getQuestionBankAttachmentDownloadUrl(attachmentId: string) {
  return `/api/question-bank/attachments/${attachmentId}/download`
}
