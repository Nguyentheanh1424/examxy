import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { StudentDashboardPage } from '@/features/student/pages/student-dashboard-page'
import { CreateTeacherClassPage } from '@/features/teacher/pages/create-teacher-class-page'
import type { StudentDashboard, StudentImportBatch, TeacherClassSummary } from '@/types/classroom'

const { classApiMock } = vi.hoisted(() => ({
  classApiMock: {
    claimStudentInviteRequest: vi.fn(),
    createTeacherClassRequest: vi.fn(),
    getStudentDashboardRequest: vi.fn(),
    importTeacherRosterRequest: vi.fn(),
    previewTeacherRosterImportRequest: vi.fn(),
  },
}))

vi.mock('@/features/classrooms/lib/class-api', () => classApiMock)

const studentDashboard: StudentDashboard = {
  classes: [
    {
      code: 'BIO-10',
      id: 'class-1',
      joinedAtUtc: '2026-04-20T08:00:00.000Z',
      membershipStatus: 'Active',
      name: 'Biology 10',
      status: 'Active',
    },
  ],
  email: 'student@example.com',
  fullName: 'Student Example',
  onboardingState: 'Completed',
  pendingInvites: [],
  studentCode: 'ST-001',
  userId: 'student-1',
  userName: 'student',
}

const createdClass: TeacherClassSummary = {
  activeStudentCount: 0,
  code: 'BIO-10',
  createdAtUtc: '2026-04-20T08:00:00.000Z',
  grade: '10',
  id: 'class-created',
  joinMode: 'InviteOnly',
  name: 'Biology 10',
  pendingInviteCount: 0,
  status: 'Active',
  subject: 'Biology',
  term: 'Semester 1 2026-2027',
}

const importResult: StudentImportBatch = {
  classId: 'class-1',
  createdAccountCount: 1,
  createdAtUtc: '2026-04-20T08:00:00.000Z',
  id: 'batch-1',
  items: [
    {
      classInviteId: 'invite-1',
      email: 'alex@student.test',
      fullName: 'Alex Nguyen',
      id: 'item-1',
      message: 'Invite sent.',
      resultType: 'Created',
      rowNumber: 1,
      studentCode: 'ST-001',
      studentUserId: 'student-1',
    },
  ],
  rejectedCount: 0,
  sentInviteCount: 1,
  skippedCount: 0,
  sourceFileName: 'manual-roster.csv',
  totalRows: 1,
}

beforeEach(() => {
  vi.clearAllMocks()
  classApiMock.getStudentDashboardRequest.mockResolvedValue(studentDashboard)
  classApiMock.claimStudentInviteRequest.mockResolvedValue({
    classCode: 'BIO-10',
    classId: 'class-1',
    className: 'Biology 10',
    joinedAtUtc: '2026-04-20T08:00:00.000Z',
    membershipStatus: 'Active',
  })
  classApiMock.createTeacherClassRequest.mockResolvedValue(createdClass)
  classApiMock.importTeacherRosterRequest.mockResolvedValue(importResult)
  classApiMock.previewTeacherRosterImportRequest.mockResolvedValue({
    classId: 'class-1',
    errorCount: 0,
    items: [
      {
        action: 'CreateAccount',
        email: 'alex@student.test',
        errors: [],
        fullName: 'Alex Nguyen',
        rowNumber: 1,
        status: 'Ready',
        studentCode: 'ST-001',
        warnings: [],
      },
    ],
    readyCount: 1,
    sourceFileName: 'manual-roster.csv',
    totalRows: 1,
    warningCount: 0,
  })
})

describe('student and teacher support pages', () => {
  it('keeps student class secondary actions in an overflow menu', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/student/dashboard']}>
        <Routes>
          <Route element={<StudentDashboardPage />} path="/student/dashboard" />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Biology 10')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open class' })).toHaveAttribute(
      'href',
      '/classes/class-1',
    )
    await user.click(screen.getByRole('button', { name: 'Thêm thao tác cho Biology 10' }))
    expect(screen.getByRole('link', { name: /Assessments/ })).toHaveAttribute(
      'href',
      '/classes/class-1/assessments',
    )
    expect(screen.queryByRole('link', { name: /Account/ })).not.toBeInTheDocument()
  })

  it('creates a teacher class and redirects to the created class', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/teacher/classes/new']}>
        <Routes>
          <Route element={<CreateTeacherClassPage />} path="/teacher/classes/new" />
          <Route element={<p>Created class route</p>} path="/classes/:classId" />
        </Routes>
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText('Class name'), 'Biology 10')
    await user.type(screen.getByLabelText('Class code'), 'BIO-10')
    expect(screen.getByText('Siêu dữ liệu thiết lập lớp học')).toBeInTheDocument()
    expect(screen.getByText('Xem trước lớp học')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Create class' }))

    await waitFor(() => {
      expect(classApiMock.createTeacherClassRequest).toHaveBeenCalledWith({
        code: 'BIO-10',
        grade: '10',
        joinMode: 'InviteOnly',
        name: 'Biology 10',
        subject: 'Math',
        term: 'Semester 1 2026-2027',
      })
    })
    expect(await screen.findByText('Created class route')).toBeInTheDocument()
  })
})
