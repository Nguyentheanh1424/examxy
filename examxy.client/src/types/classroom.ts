export interface TeacherClassSummary {
  id: string
  name: string
  code: string
  subject: string
  grade: string
  term: string
  joinMode: 'InviteOnly' | 'CodeJoin' | string
  status: string
  createdAtUtc: string
  activeStudentCount: number
  pendingInviteCount: number
}

export interface ClassMembership {
  id: string
  studentUserId: string
  studentUserName: string
  studentFullName: string
  email: string
  studentCode: string
  status: string
  joinedAtUtc: string | null
}

export interface ClassInvite {
  id: string
  email: string
  status: string
  sentAtUtc: string
  expiresAtUtc: string
  usedAtUtc: string | null
  studentUserId: string
  usedByUserId: string
}

export interface TeacherClassDetail {
  id: string
  name: string
  code: string
  subject: string
  grade: string
  term: string
  joinMode: 'InviteOnly' | 'CodeJoin' | string
  status: string
  createdAtUtc: string
  memberships: ClassMembership[]
  invites: ClassInvite[]
  importBatches: StudentImportBatch[]
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
  subject?: string
  grade?: string
  term?: string
  joinMode?: 'InviteOnly' | 'CodeJoin'
}

export interface UpdateTeacherClassRequest {
  name: string
  code: string
  status: 'Active' | 'Archived'
}

export interface AddStudentByEmailRequest {
  email: string
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

export interface RosterImportPreviewItem {
  rowNumber: number
  fullName: string
  studentCode: string
  email: string
  status: 'Ready' | 'Warning' | 'Error' | string
  action: 'CreateAccount' | 'SendInvite' | 'Skip' | 'Reject' | string
  warnings: string[]
  errors: string[]
}

export interface RosterImportPreview {
  classId: string
  sourceFileName: string
  totalRows: number
  readyCount: number
  warningCount: number
  errorCount: number
  items: RosterImportPreviewItem[]
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
