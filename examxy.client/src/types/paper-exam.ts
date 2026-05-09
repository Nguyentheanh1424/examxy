export interface PaperExamTemplateAsset {
  id: string
  assetType: string
  storagePath: string
  contentHash: string
  jsonContent: string
  isRequired: boolean
}

export interface PaperExamMetadataField {
  id: string
  fieldCode: string
  label: string
  isRequired: boolean
  decodeMode: string
  geometryJson: string
  validationPolicyJson: string
}

export interface PaperExamTemplateVersion {
  id: string
  templateId: string
  versionNumber: number
  schemaVersion: string
  geometryConfigHash: string
  status: string
  questionCount: number
  optionsPerQuestion: number
  absThreshold: number
  relThreshold: number
  scoringMethod: string
  scoringParamsJson: string
  payloadSchemaVersion: string
  minClientAppVersion: string | null
  createdAtUtc: string
  updatedAtUtc: string
  publishedAtUtc: string | null
  assets: PaperExamTemplateAsset[]
  metadataFields: PaperExamMetadataField[]
}

export interface PaperExamTemplate {
  id: string
  code: string
  name: string
  description: string
  status: string
  paperSize: string
  outputWidth: number | null
  outputHeight: number | null
  markerScheme: string
  hasStudentIdField: boolean
  hasQuizIdField: boolean
  hasHandwrittenRegions: boolean
  createdAtUtc: string
  updatedAtUtc: string
  versions: PaperExamTemplateVersion[]
}

export interface CreatePaperExamTemplateRequest {
  code: string
  name: string
  description: string
  paperSize: string
  outputWidth: number | null
  outputHeight: number | null
  markerScheme: string
  hasStudentIdField: boolean
  hasQuizIdField: boolean
  hasHandwrittenRegions: boolean
}

export interface CreatePaperExamTemplateVersionRequest {
  schemaVersion: string
  questionCount: number
  optionsPerQuestion: number
  absThreshold: number
  relThreshold: number
  scoringMethod: string
  scoringParamsJson: string
  payloadSchemaVersion: string
  minClientAppVersion: string | null
}

export type UpdatePaperExamTemplateVersionRequest =
  CreatePaperExamTemplateVersionRequest

export interface UploadPaperExamTemplateAssetRequest {
  assetType: string
  jsonContent: string
  isRequired: boolean
  fileName: string
  contentType: string
  base64Content: string | null
}

export interface UpsertPaperExamMetadataFieldRequest {
  fieldCode: string
  label: string
  isRequired: boolean
  decodeMode: string
  geometryJson: string
  validationPolicyJson: string
}

export interface ValidatePaperExamTemplateVersionResult {
  templateVersionId: string
  isValid: boolean
  geometryConfigHash: string
  errors: string[]
  warnings: string[]
}

export interface AssessmentPaperBindingMapItem {
  questionNumber: number
  assessmentItemId: string
}

export interface UpsertAssessmentPaperBindingRequest {
  templateVersionId: string
  answerMap: AssessmentPaperBindingMapItem[]
  metadataPolicyJson: string
  submissionPolicyJson: string
  reviewPolicyJson: string
  activate: boolean
}

export interface AssessmentPaperBinding {
  id: string
  assessmentId: string
  templateVersionId: string
  templateCode: string
  templateVersionNumber: number
  bindingVersion: number
  configHash: string
  status: string
  answerMapJson: string
  metadataPolicyJson: string
  submissionPolicyJson: string
  reviewPolicyJson: string
  createdAtUtc: string
  updatedAtUtc: string
}

export interface StudentOfflineScanConfig {
  assessmentId: string
  classId: string
  bindingId: string
  bindingVersion: number
  templateCode: string
  templateVersion: number
  schemaVersion: string
  configHash: string
  paperSize: string
  outputWidth: number | null
  outputHeight: number | null
  markerScheme: string
  questionCount: number
  optionsPerQuestion: number
  absThreshold: number
  relThreshold: number
  scoringMethod: string
  markerLayout: unknown
  circleRois: unknown
  idBubbleFields: unknown
  regionWindows: unknown
  requiredMetadataFields: string[]
  optionalMetadataFields: string[]
  metadataPolicy: unknown
  reviewPolicy: unknown
  submissionPolicy: unknown
  minClientAppVersion: string | null
  closeAtUtc: string | null
}

export interface OfflineRecognizedAnswer {
  questionNumber: number
  detectedOption: string
  detectedAnswerJson: string
  confidenceJson: string
}

export interface AssessmentScanAnswer {
  id: string
  assessmentItemId: string
  questionNumber: number
  detectedOption: string
  detectedAnswerJson: string
  isCorrect: boolean | null
  earnedPoints: number
  confidenceJson: string
}

export interface AssessmentScanArtifact {
  id: string
  artifactType: string
  storagePath: string
  contentHash: string
}

export interface AssessmentScanResult {
  id: string
  score: number
  gradedQuestionCount: number
  totalQuestionCount: number
  detectedStudentId: string | null
  detectedQuizId: string | null
  confidenceSummaryJson: string
  warningFlagsJson: string
  conflictFlagsJson: string
}

export interface AssessmentScanSubmission {
  id: string
  assessmentId: string
  studentUserId: string
  bindingId: string
  bindingVersionUsed: number
  configHashUsed: string
  clientSchemaVersion: string
  clientAppVersion: string | null
  rawImagePath: string
  status: string
  createdAtUtc: string
  updatedAtUtc: string
  finalizedAtUtc: string | null
  teacherNote: string | null
  reviewedByTeacherUserId: string | null
  reviewedAtUtc: string | null
  result: AssessmentScanResult | null
  answers: AssessmentScanAnswer[]
  artifacts: AssessmentScanArtifact[]
}

export interface SubmitOfflineAssessmentScanRequest {
  rawImage: File
  bindingId: string
  bindingVersionUsed: number
  configHashUsed: string
  clientSchemaVersion: string
  clientAppVersion?: string | null
  answers: OfflineRecognizedAnswer[]
  metadataJson?: string
  confidenceSummaryJson?: string
  warningFlagsJson?: string
  conflictFlagsJson?: string
  rawScanPayloadJson?: string
}

export interface ReviewOfflineAssessmentScanRequest {
  teacherNote: string | null
  forceFinalize: boolean
  overrideAnswers: OfflineRecognizedAnswer[]
}
