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
  id: 'class-1',
  name: 'Toan 10A',
  pendingInviteCount: 3,
  status: 'Active',
}

const secondActiveClass: TeacherClassSummary = {
  activeStudentCount: 18,
  code: 'PHYS-11B',
  createdAtUtc: '2026-04-21T08:00:00.000Z',
  id: 'class-2',
  name: 'Vat ly 11B',
  pendingInviteCount: 1,
  status: 'Active',
}

const archivedClass: TeacherClassSummary = {
  activeStudentCount: 99,
  code: 'OLD-2025',
  createdAtUtc: '2025-04-20T08:00:00.000Z',
  id: 'class-archived',
  name: 'Lop da luu tru',
  pendingInviteCount: 9,
  status: 'Archived',
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
    renderPage()

    expect(await screen.findByText('Toan 10A')).toBeInTheDocument()
    expect(screen.getByText('Vat ly 11B')).toBeInTheDocument()
    expect(screen.getByText('Lop da luu tru')).toBeInTheDocument()

    const firstClass = screen.getByText('Toan 10A').closest('article, div')
    expect(firstClass).not.toBeNull()

    expect(screen.getAllByRole('link', { name: /Mở lớp/ })[0]).toHaveAttribute(
      'href',
      '/classes/class-1',
    )
    expect(screen.getAllByRole('link', { name: /Bài đánh giá/ })[0]).toHaveAttribute(
      'href',
      '/classes/class-1/assessments',
    )
    expect(screen.getAllByRole('link', { name: /Nhập học sinh/ })[0]).toHaveAttribute(
      'href',
      '/teacher/classes/class-1/import',
    )
  })

  it('derives metrics from active classes only', async () => {
    renderPage()

    await screen.findByText('Toan 10A')

    const metrics = screen.getByLabelText('Teacher dashboard metrics')

    expect(within(metrics).getByText('Lớp đang hoạt động')).toBeInTheDocument()
    expect(within(metrics).getByText('2')).toBeInTheDocument()
    expect(within(metrics).getByText('Học sinh đang học')).toBeInTheDocument()
    expect(within(metrics).getByText('50')).toBeInTheDocument()
    expect(within(metrics).getByText('Lời mời đang chờ')).toBeInTheDocument()
    expect(within(metrics).getByText('4')).toBeInTheDocument()
  })

  it('shows an empty state and navigates to class creation', async () => {
    const user = userEvent.setup()
    classApiMock.getTeacherClassesRequest.mockResolvedValue([])

    renderPage()

    expect(await screen.findByText('Chưa có lớp nào')).toBeInTheDocument()
    const createButtons = screen.getAllByRole('button', { name: 'Tạo lớp mới' })
    await user.click(createButtons[createButtons.length - 1])

    expect(await screen.findByText('Create class route')).toBeInTheDocument()
  })

  it('renders the error notice when classes cannot load', async () => {
    classApiMock.getTeacherClassesRequest.mockRejectedValue(new Error('Network error'))

    renderPage()

    expect(await screen.findByText('Unable to load classes')).toBeInTheDocument()
    expect(screen.getByText('Unable to load your classes.')).toBeInTheDocument()
  })

  it('keeps dashboard and class route links valid', async () => {
    renderPage()

    await screen.findByText('Toan 10A')

    expect(screen.getAllByRole('link', { name: /Thông báo/ })[0]).toHaveAttribute(
      'href',
      '/notifications',
    )
    expect(screen.getByRole('link', { name: /Tài khoản/ })).toHaveAttribute(
      'href',
      '/account',
    )
    expect(screen.getByRole('link', { name: /Ngân hàng câu hỏi/ })).toHaveAttribute(
      'href',
      '/teacher/question-bank',
    )
    expect(screen.getByRole('link', { name: /Đề giấy/ })).toHaveAttribute(
      'href',
      '/teacher/paper-exams',
    )
    expect(screen.getAllByRole('link', { name: /Tạo lớp mới/ })[0]).toHaveAttribute(
      'href',
      '/teacher/classes/new',
    )
  })

  it('shows skeleton loading state before the API resolves', async () => {
    let resolveClasses: (classes: TeacherClassSummary[]) => void = () => undefined
    classApiMock.getTeacherClassesRequest.mockReturnValue(
      new Promise<TeacherClassSummary[]>((resolve) => {
        resolveClasses = resolve
      }),
    )

    renderPage()

    expect(screen.getByLabelText('Loading classes')).toBeInTheDocument()

    resolveClasses([activeClass])

    await waitFor(() => {
      expect(screen.queryByLabelText('Loading classes')).not.toBeInTheDocument()
    })
  })
})
