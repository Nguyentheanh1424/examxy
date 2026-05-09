export type QuestionAuthoringMode = 'Basic' | 'Rich' | 'Legacy'

export type RichContentDocument = {
  schemaVersion: number
  blocks: RichContentBlock[]
}

export type RichContentBlock = {
  type: string
  inline?: InlineNode[]
  latex?: string
  attachmentId?: string
  altText?: string
  caption?: string
  graphType?: string
  expressions?: { latex: string }[]
  rows?: TableCell[][]
  code?: string
}

export type InlineNode = {
  type: string
  text?: string
  latex?: string
  value?: string
}

export type TableCell = {
  content: RichContentDocument
  colSpan?: number
  rowSpan?: number
}

export interface QuestionAttachment {
  id: string
  fileName: string
  originalFileName?: string
  contentType: string
  fileSizeBytes: number
  externalUrl: string
  storageProvider?: string
  storageKey?: string
  publicUrl?: string
  status?: string
  createdAtUtc?: string
}

export interface QuestionVersion {
  id: string
  versionNumber: number
  questionType: string
  stemRichText: string
  stemPlainText: string
  explanationRichText: string
  difficulty: string
  estimatedSeconds: number
  contentJson: string
  answerKeyJson: string
  attachments: QuestionAttachment[]
  contentSchemaVersion?: number
  answerKeySchemaVersion?: number
  rendererVersion?: string
  explanationJson?: string
  searchText?: string
  createdByUserId?: string
}

export interface Question {
  id: string
  code: string
  status: string
  currentVersionNumber: number
  createdAtUtc: string
  updatedAtUtc: string
  versions: QuestionVersion[]
  tags: string[]
}

export interface CreateQuestionAttachmentRequest {
  fileName: string
  contentType: string
  fileSizeBytes: number
  externalUrl: string
}

export interface QuestionChoiceRequest {
  id?: string
  text?: string
  content?: RichContentDocument
  isCorrect?: boolean
}

export interface QuestionAnswerKeyRequest {
  correctChoiceIds?: string[]
  value?: boolean
  matches?: { leftId: string; rightId: string }[]
  orderedItemIds?: string[]
  gradingMode?: string
}

export interface MatchingItemRequest {
  id?: string
  text?: string
  content?: RichContentDocument
}

export interface OrderingItemRequest {
  id?: string
  text?: string
  content?: RichContentDocument
}

export interface QuestionMediaRequest {
  type: string
  attachmentId: string
}

export interface CreateQuestionRequest {
  stemRichText: string
  stemPlainText: string
  questionType: string
  explanationRichText: string
  difficulty: string
  estimatedSeconds: number
  contentJson: string
  answerKeyJson: string
  tags: string[]
  attachments: CreateQuestionAttachmentRequest[]
  authoringMode?: QuestionAuthoringMode
  stemText?: string
  stem?: RichContentDocument
  choices?: QuestionChoiceRequest[]
  answerKey?: QuestionAnswerKeyRequest
  explanation?: RichContentDocument
  leftItems?: MatchingItemRequest[]
  rightItems?: MatchingItemRequest[]
  items?: OrderingItemRequest[]
  media?: QuestionMediaRequest[]
}

export interface UpdateQuestionRequest extends CreateQuestionRequest {
  status: string
}

export interface QuestionBankSearchQuery {
  query?: string
  status?: string
  type?: string
  difficulty?: string
  tag?: string
  hasMath?: boolean
  hasMedia?: boolean
  hasGraph?: boolean
  schemaVersion?: number
  page?: number
  pageSize?: number
}

export interface QuestionBankSearchResult {
  items: Question[]
  page: number
  pageSize: number
  totalCount: number
  facets: {
    types: string[]
    tags: string[]
    difficulties: string[]
  }
}

export interface QuestionBankCapabilities {
  contentSchemaVersion: number
  supportedQuestionTypes: string[]
  supportedContentBlocks: string[]
  latex: {
    enabled: boolean
    allowInlineMath: boolean
    allowDisplayMath: boolean
  }
  attachments: {
    maxImageSizeBytes: number
    allowedImageContentTypes: string[]
  }
}

export interface QuestionLatexPreviewRequest {
  question?: CreateQuestionRequest
  questionId?: string
  questionVersionId?: string
  includeAnswers?: boolean
  includeExplanations?: boolean
  choiceLayout?: string
}

export interface QuestionBankRenderDiagnostic {
  questionVersionId?: string
  code: string
  message: string
  path: string
}

export interface QuestionLatexPreviewResponse {
  latex: string
  latexFragment: string
  warnings: QuestionBankRenderDiagnostic[]
  errors: QuestionBankRenderDiagnostic[]
}

export interface QuestionImportPreviewRequest {
  questionType: string
  sourceFormat: 'LatexText'
  rawText: string
}

export interface QuestionBankImportDiagnostic {
  code: string
  message: string
  path: string
}

export interface QuestionImportPreviewResponse {
  status: 'Parsed' | 'ParsedWithWarnings' | 'Failed'
  questionType: string
  draft: CreateQuestionRequest
  warnings: QuestionBankImportDiagnostic[]
  errors: QuestionBankImportDiagnostic[]
}

export interface CreateQuestionBankExportRequest {
  title: string
  description?: string
  questionVersionIds: string[]
  options?: Record<string, unknown>
}

export interface QuestionBankExportJob {
  exportJobId: string
  status: string
  title?: string
  description?: string
  questionCount?: number
  downloadUrl?: string
  warnings?: string[]
  errors?: {
    questionVersionId?: string
    code: string
    message: string
  }[]
}

export interface CreateQuestionBankAttachmentUploadUrlRequest {
  fileName: string
  contentType: string
  fileSizeBytes: number
}

export interface CreateQuestionBankAttachmentUploadUrlResponse {
  attachmentId: string
  uploadUrl: string
  method: string
  headers: Record<string, string>
  attachment: QuestionAttachment
}

export interface CompleteQuestionBankAttachmentUploadRequest {
  attachmentId: string
  base64Content: string
  contentHash?: string
}
