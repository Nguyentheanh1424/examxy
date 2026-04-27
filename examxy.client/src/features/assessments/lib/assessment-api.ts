import { apiRequest } from '@/lib/http/api-client'
import type {
  Assessment,
  CreateAssessmentRequest,
  PublishAssessmentRequest,
  SaveAttemptAnswersRequest,
  StudentAssessmentAttempt,
  UpdateAssessmentRequest,
} from '@/types/assessment'

export function getClassAssessmentsRequest(classId: string) {
  return apiRequest<Assessment[]>(`/classes/${classId}/assessments`, {
    auth: true,
  })
}

export function createAssessmentRequest(
  classId: string,
  request: CreateAssessmentRequest,
) {
  return apiRequest<Assessment>(`/classes/${classId}/assessments`, {
    auth: true,
    method: 'POST',
    body: request,
  })
}

export function updateAssessmentRequest(
  classId: string,
  assessmentId: string,
  request: UpdateAssessmentRequest,
) {
  return apiRequest<Assessment>(`/classes/${classId}/assessments/${assessmentId}`, {
    auth: true,
    method: 'PUT',
    body: request,
  })
}

export function publishAssessmentRequest(
  classId: string,
  assessmentId: string,
  request: PublishAssessmentRequest,
) {
  return apiRequest<Assessment>(`/classes/${classId}/assessments/${assessmentId}/publish`, {
    auth: true,
    method: 'POST',
    body: request,
  })
}

export function startAssessmentAttemptRequest(classId: string, assessmentId: string) {
  return apiRequest<StudentAssessmentAttempt>(
    `/classes/${classId}/assessments/${assessmentId}/attempts`,
    {
      auth: true,
      method: 'POST',
    },
  )
}

export function saveAssessmentAnswersRequest(
  classId: string,
  attemptId: string,
  request: SaveAttemptAnswersRequest,
) {
  return apiRequest<StudentAssessmentAttempt>(
    `/classes/${classId}/assessments/attempts/${attemptId}/answers`,
    {
      auth: true,
      method: 'PUT',
      body: request,
    },
  )
}

export function submitAssessmentAttemptRequest(classId: string, attemptId: string) {
  return apiRequest<StudentAssessmentAttempt>(
    `/classes/${classId}/assessments/attempts/${attemptId}/submit`,
    {
      auth: true,
      method: 'POST',
    },
  )
}

export function getAssessmentResultsRequest(classId: string, assessmentId: string) {
  return apiRequest<StudentAssessmentAttempt[]>(
    `/classes/${classId}/assessments/${assessmentId}/results`,
    {
      auth: true,
    },
  )
}
