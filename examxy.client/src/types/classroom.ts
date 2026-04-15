export interface TeacherClassSummary {
  id: string
  name: string
  code: string
  status: string
  createdAtUtc: string
  activeStudentCount: number
  pendingInviteCount: number
}

export interface StudentImportItem {
  id: string
  rowNumber: number
  fullName: string
  studentCode: string
  email: string
  resultType: string
  message: string
  studentUserId: string
  classInviteId: string | null
}

export interface StudentImportBatch {
  id: string
  classId: string
  sourceFileName: string
  createdAtUtc: string
  totalRows: number
  createdAccountCount: number
  sentInviteCount: number
  skippedCount: number
  rejectedCount: number
  items: StudentImportItem[]
}

export interface CreateTeacherClassRequest {
  name: string
  code?: string
}

export interface UpdateTeacherClassRequest {
  name: string
  code: string
  status: 'Active' | 'Archived'
}

export interface StudentRosterRowInput {
  fullName: string
  studentCode: string
  email: string
}

export interface ImportStudentRosterRequest {
  sourceFileName: string
  students: StudentRosterRowInput[]
}

export interface StudentDashboardClass {
  id: string
  name: string
  code: string
  status: string
  membershipStatus: string
  joinedAtUtc: string | null
}

export interface StudentPendingInvite {
  id: string
  classId: string
  className: string
  classCode: string
  status: string
  expiresAtUtc: string
  sentAtUtc: string
}

export interface StudentDashboard {
  userId: string
  userName: string
  fullName: string
  email: string
  studentCode: string
  onboardingState: string
  classes: StudentDashboardClass[]
  pendingInvites: StudentPendingInvite[]
}

export interface ClaimClassInviteRequest {
  inviteCode: string
}

export interface ClaimClassInviteResult {
  classId: string
  className: string
  classCode: string
  membershipStatus: string
  joinedAtUtc: string
}
