import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TeacherDashboardPage } from '@/features/teacher/pages/teacher-dashboard-page'
import type { TeacherClassSummary } from '@/types/classroom'

const { classApiMock } = vi.hoisted(() => ({
  classApiMock: {
    getTeacherClassesRequest: vi.fn(),
  },
}))

vi.mock('@/features/classrooms/lib/class-api', () => classApiMock)

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/teacher/dashboard']}>
      <Routes>
        <Route element={<TeacherDashboardPage />} path="/teacher/dashboard" />
        <Route element={<p>Create class route</p>} path="/teacher/classes/new" />
      </Routes>
    </MemoryRouter>,
  )
}

const activeClass: TeacherClassSummary = {
  activeStudentCount: 32,
  code: 'MATH-10A',
  createdAtUtc: '2026-04-20T08:00:00.000Z',
  grade: '10',
  id: 'class-1',
  joinMode: 'InviteOnly',
  name: 'Toan 10A',
  pendingInviteCount: 3,
  status: 'Active',
  subject: 'Math',
  term: 'Semester 1 2026-2027',
}

const secondActiveClass: TeacherClassSummary = {
  activeStudentCount: 18,
  code: 'PHYS-11B',
  createdAtUtc: '2026-04-21T08:00:00.000Z',
  grade: '11',
  id: 'class-2',
  joinMode: 'InviteOnly',
  name: 'Vat ly 11B',
  pendingInviteCount: 1,
  status: 'Active',
  subject: 'Physics',
  term: 'Semester 1 2026-2027',
}

const archivedClass: TeacherClassSummary = {
  activeStudentCount: 99,
  code: 'OLD-2025',
  createdAtUtc: '2025-04-20T08:00:00.000Z',
  grade: '12',
  id: 'class-archived',
  joinMode: 'InviteOnly',
  name: 'Lop da luu tru',
  pendingInviteCount: 9,
  status: 'Archived',
  subject: 'History',
  term: 'Semester 2 2025-2026',
}

beforeEach(() => {
  vi.clearAllMocks()
  classApiMock.getTeacherClassesRequest.mockResolvedValue([
    activeClass,
    secondActiveClass,
    archivedClass,
  ])
})

describe('TeacherDashboardPage', () => {
  it('loads classes and renders real class cards with actions', async () => {
    const user = userEvent.setup()

    renderPage()

    expect(await screen.findByText('Toan 10A')).toBeInTheDocument()
    expect(screen.getByText('Vat ly 11B')).toBeInTheDocument()
    expect(screen.getByText('Lop da luu tru')).toBeInTheDocument()

    expect(
      screen.getAllByRole('link').some((link) => link.getAttribute('href') === '/classes/class-1'),
    ).toBe(true)
    await user.click(screen.getByRole('button', { name: 'Thêm thao tác cho Toan 10A' }))
    expect(
      screen
        .getAllByRole('link')
        .some((link) => link.getAttribute('href') === '/classes/class-1/assessments'),
    ).toBe(true)
    expect(
      screen
        .getAllByRole('link')
        .some((link) => link.getAttribute('href') === '/teacher/classes/class-1/import'),
    ).toBe(true)
  })

  it('derives metrics from active classes only', async () => {
    renderPage()

    await screen.findByText('Toan 10A')

    const metrics = screen.getByLabelText('Teacher dashboard metrics')

    expect(within(metrics).getByText('2')).toBeInTheDocument()
    expect(within(metrics).getByText('50')).toBeInTheDocument()
    expect(within(metrics).getByText('4')).toBeInTheDocument()
  })

  it('shows an empty state and navigates to class creation', async () => {
    const user = userEvent.setup()
    classApiMock.getTeacherClassesRequest.mockResolvedValue([])

    renderPage()

    expect(await screen.findByText('Chưa có lớp nào')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Tạo lớp mới' }))

    expect(await screen.findByText('Create class route')).toBeInTheDocument()
  })

  it('renders the error notice when classes cannot load', async () => {
    classApiMock.getTeacherClassesRequest.mockRejectedValue(new Error('Network error'))

    renderPage()

    expect(await screen.findByText('Không thể tải lớp học')).toBeInTheDocument()
    expect(screen.getByText('Không thể tải danh sách lớp học của bạn.')).toBeInTheDocument()
  })

  it('keeps dashboard and class route links valid without page-level account actions', async () => {
    renderPage()

    await screen.findByText('Toan 10A')

    const hrefs = screen.getAllByRole('link').map((link) => link.getAttribute('href'))

    expect(hrefs).toContain('/teacher/classes/new')
    expect(hrefs).toContain('/classes/class-1')
    expect(hrefs).not.toContain('/account')
    expect(hrefs.filter((href) => href === '/teacher/classes/new')).toHaveLength(1)
  })

  it('shows skeleton loading state before the API resolves', async () => {
    let resolveClasses: (classes: TeacherClassSummary[]) => void = () => undefined
    classApiMock.getTeacherClassesRequest.mockReturnValue(
      new Promise<TeacherClassSummary[]>((resolve) => {
        resolveClasses = resolve
      }),
    )

    renderPage()

    expect(screen.getByLabelText('Đang tải lớp học')).toBeInTheDocument()

    resolveClasses([activeClass])

    await waitFor(() => {
      expect(screen.queryByLabelText('Đang tải lớp học')).not.toBeInTheDocument()
    })
  })
})
