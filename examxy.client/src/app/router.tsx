import { Navigate, createBrowserRouter, useParams } from 'react-router-dom'

import { AppLayout } from '@/app/app-layout'
import { NotFoundPage } from '@/app/not-found-page'
import { AuthProvider } from '@/features/auth/auth-context'
import { RealtimeProvider } from '@/features/realtime/realtime-context'
import { GuestOnlyRoute } from '@/features/auth/components/guest-only-route'
import { ProtectedRoute } from '@/features/auth/components/protected-route'
import { AccountPage } from '@/features/auth/pages/account-page'
import { ConfirmEmailPage } from '@/features/auth/pages/confirm-email-page'
import { ForgotPasswordPage } from '@/features/auth/pages/forgot-password-page'
import { LoginPage } from '@/features/auth/pages/login-page'
import { RegisterPage } from '@/features/auth/pages/register-page'
import { ResendEmailConfirmationPage } from '@/features/auth/pages/resend-email-confirmation-page'
import { ResetPasswordPage } from '@/features/auth/pages/reset-password-page'
import { RootRedirectPage } from '@/features/auth/pages/root-redirect-page'
import { AdminDashboardPage } from '@/features/admin/pages/admin-dashboard-page'
import { ClassAssessmentsPage } from '@/features/assessments/pages/class-assessments-page'
import { StudentRegisterPage } from '@/features/student/pages/student-register-page'
import { StudentDashboardPage } from '@/features/student/pages/student-dashboard-page'
import { ClassDashboardPage } from '@/features/class-dashboard/pages/class-dashboard-page'
import { NotificationsPage } from '@/features/notifications/pages/notifications-page'
import { PaperExamTemplatesPage } from '@/features/paper-exams/pages/paper-exam-templates-page'
import { QuestionBankPage } from '@/features/question-bank/pages/question-bank-page'
import { CreateTeacherClassPage } from '@/features/teacher/pages/create-teacher-class-page'
import { TeacherClassImportPage } from '@/features/teacher/pages/teacher-class-import-page'
import { TeacherDashboardPage } from '@/features/teacher/pages/teacher-dashboard-page'

function RootFrame() {
  return (
    <AuthProvider>
      <RealtimeProvider>
        <AppLayout />
      </RealtimeProvider>
    </AuthProvider>
  )
}

function LegacyTeacherClassRedirect() {
  const { classId = '' } = useParams()
  return <Navigate replace to={`/classes/${classId}`} />
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootFrame />,
    children: [
      {
        index: true,
        element: <RootRedirectPage />,
      },
      {
        path: 'login',
        element: (
          <GuestOnlyRoute>
            <LoginPage />
          </GuestOnlyRoute>
        ),
      },
      {
        path: 'register',
        element: (
          <GuestOnlyRoute>
            <RegisterPage />
          </GuestOnlyRoute>
        ),
      },
      {
        path: 'student/register',
        element: (
          <GuestOnlyRoute>
            <StudentRegisterPage />
          </GuestOnlyRoute>
        ),
      },
      {
        path: 'forgot-password',
        element: <ForgotPasswordPage />,
      },
      {
        path: 'resend-email-confirmation',
        element: <ResendEmailConfirmationPage />,
      },
      {
        path: 'confirm-email',
        element: <ConfirmEmailPage />,
      },
      {
        path: 'reset-password',
        element: <ResetPasswordPage />,
      },
      {
        path: 'teacher/dashboard',
        element: (
          <ProtectedRoute allowedRoles={['Teacher']}>
            <TeacherDashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'teacher/classes/new',
        element: (
          <ProtectedRoute allowedRoles={['Teacher']}>
            <CreateTeacherClassPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'teacher/classes/:classId',
        element: (
          <ProtectedRoute allowedRoles={['Teacher']}>
            <LegacyTeacherClassRedirect />
          </ProtectedRoute>
        ),
      },
      {
        path: 'classes/:classId',
        element: (
          <ProtectedRoute allowedRoles={['Teacher', 'Student']}>
            <ClassDashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'classes/:classId/assessments',
        element: (
          <ProtectedRoute allowedRoles={['Teacher', 'Student']}>
            <ClassAssessmentsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'teacher/classes/:classId/import',
        element: (
          <ProtectedRoute allowedRoles={['Teacher']}>
            <TeacherClassImportPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'teacher/question-bank',
        element: (
          <ProtectedRoute allowedRoles={['Teacher']}>
            <QuestionBankPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'teacher/paper-exams',
        element: (
          <ProtectedRoute allowedRoles={['Teacher', 'Admin']}>
            <PaperExamTemplatesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'student/dashboard',
        element: (
          <ProtectedRoute allowedRoles={['Student']}>
            <StudentDashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'notifications',
        element: (
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/dashboard',
        element: (
          <ProtectedRoute allowedRoles={['Admin']}>
            <AdminDashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'account',
        element: (
          <ProtectedRoute>
            <AccountPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
])
