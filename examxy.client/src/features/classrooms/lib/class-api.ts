import { apiRequest } from '@/lib/http/api-client'
import type {
  AddStudentByEmailRequest,
  ClaimClassInviteRequest,
  ClaimClassInviteResult,
  ClassInvite,
  CreateTeacherClassRequest,
  ImportStudentRosterRequest,
  RosterImportPreview,
  StudentDashboard,
  StudentImportItem,
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

export function getTeacherClassRequest(classId: string) {
  return apiRequest<TeacherClassDetail>(`/classes/${classId}`, {
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

export function deleteTeacherClassMembershipRequest(
  classId: string,
  membershipId: string,
) {
  return apiRequest<void>(`/classes/${classId}/memberships/${membershipId}`, {
    auth: true,
    method: 'DELETE',
  })
}

export function resendTeacherClassInviteRequest(
  classId: string,
  inviteId: string,
) {
  return apiRequest<ClassInvite>(`/classes/${classId}/invites/${inviteId}/resend`, {
    auth: true,
    method: 'POST',
  })
}

export function cancelTeacherClassInviteRequest(
  classId: string,
  inviteId: string,
) {
  return apiRequest<ClassInvite>(`/classes/${classId}/invites/${inviteId}/cancel`, {
    auth: true,
    method: 'POST',
  })
}

export function addTeacherClassStudentByEmailRequest(
  classId: string,
  request: AddStudentByEmailRequest,
) {
  return apiRequest<StudentImportItem>(`/classes/${classId}/students`, {
    auth: true,
    method: 'POST',
    body: request,
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

export function previewTeacherRosterImportRequest(
  classId: string,
  request: ImportStudentRosterRequest,
) {
  return apiRequest<RosterImportPreview>(
    `/classes/${classId}/roster-imports/preview`,
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
