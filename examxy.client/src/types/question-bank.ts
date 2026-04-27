export interface QuestionAttachment {
  id: string
  fileName: string
  contentType: string
  fileSizeBytes: number
  externalUrl: string
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
}

export interface UpdateQuestionRequest extends CreateQuestionRequest {
  status: string
}
