import { apiRequest } from '@/lib/http/api-client'
import type {
  ClaimClassInviteRequest,
  ClaimClassInviteResult,
  CreateTeacherClassRequest,
  ImportStudentRosterRequest,
  StudentDashboard,
  StudentImportBatch,
  TeacherClassDetail,
  TeacherClassSummary,
  UpdateTeacherClassRequest,
} from '@/types/classroom'

export function getTeacherClassesRequest() {
  return apiRequest<TeacherClassSummary[]>('/classes', {
    auth: true,
  })
}

export function createTeacherClassRequest(request: CreateTeacherClassRequest) {
  return apiRequest<TeacherClassSummary>('/classes', {
    auth: true,
    method: 'POST',
    body: request,
  })
}

export function getTeacherClassRequest(classId: string) {
  return apiRequest<TeacherClassDetail>(`/classes/${classId}`, {
    auth: true,
  })
}

export function updateTeacherClassRequest(
  classId: string,
  request: UpdateTeacherClassRequest,
) {
  return apiRequest<TeacherClassSummary>(`/classes/${classId}`, {
    auth: true,
    method: 'PUT',
    body: request,
  })
}

export function deleteTeacherClassRequest(classId: string) {
  return apiRequest<void>(`/classes/${classId}`, {
    auth: true,
    method: 'DELETE',
  })
}

export function importTeacherRosterRequest(
  classId: string,
  request: ImportStudentRosterRequest,
) {
  return apiRequest<StudentImportBatch>(
    `/classes/${classId}/roster-imports`,
    {
      auth: true,
      method: 'POST',
      body: request,
    },
  )
}

export function getStudentDashboardRequest() {
  return apiRequest<StudentDashboard>('/student/dashboard', {
    auth: true,
  })
}

export function claimStudentInviteRequest(request: ClaimClassInviteRequest) {
  return apiRequest<ClaimClassInviteResult>('/student/invites/claim', {
    auth: true,
    method: 'POST',
    body: request,
  })
}
