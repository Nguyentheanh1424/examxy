import { apiRequest } from '@/lib/http/api-client'
import type {
  AuthSession,
  AccountProfile,
  AccountNotificationPreference,
  AccountSession,
  ChangePasswordRequest,
  ConfirmEmailRequest,
  CurrentUser,
  ForgotPasswordRequest,
  LoginRequest,
  RefreshTokenRequest,
  RegisterRequest,
  ResendEmailConfirmationRequest,
  ResetPasswordRequest,
  StudentRegisterRequest,
  UpdateAccountNotificationPreferencesRequest,
  UpdateAccountProfileRequest,
} from '@/types/auth'

export function getAccountAvatarUrl() {
  return '/api/account/profile/avatar'
}

export function loginRequest(request: LoginRequest) {
  return apiRequest<AuthSession>('/auth/login', {
    method: 'POST',
    body: request,
  })
}

export function registerRequest(request: RegisterRequest) {
  return apiRequest<AuthSession>('/auth/register', {
    method: 'POST',
    body: request,
  })
}

export function registerStudentRequest(request: StudentRegisterRequest) {
  return apiRequest<AuthSession>('/auth/register/student', {
    method: 'POST',
    body: request,
  })
}

export function refreshTokenRequest(request: RefreshTokenRequest) {
  return apiRequest<AuthSession>('/auth/refresh-token', {
    method: 'POST',
    body: request,
  })
}

export function logoutRequest(refreshToken: string) {
  return apiRequest<void>('/auth/logout', {
    auth: true,
    method: 'POST',
    body: { refreshToken },
  })
}

export function getCurrentUserRequest() {
  return apiRequest<CurrentUser>('/auth/me', {
    auth: true,
  })
}

export function getAccountProfileRequest() {
  return apiRequest<AccountProfile>('/account/profile', {
    auth: true,
  })
}

export function updateAccountProfileRequest(request: UpdateAccountProfileRequest) {
  return apiRequest<AccountProfile>('/account/profile', {
    auth: true,
    method: 'PUT',
    body: request,
  })
}

export function updateAccountAvatarRequest(avatar: File) {
  const formData = new FormData()
  formData.append('avatar', avatar)

  return apiRequest<AccountProfile>('/account/profile/avatar', {
    auth: true,
    method: 'POST',
    body: formData,
  })
}

export function deleteAccountAvatarRequest() {
  return apiRequest<void>('/account/profile/avatar', {
    auth: true,
    method: 'DELETE',
  })
}

export function changePasswordRequest(request: ChangePasswordRequest) {
  return apiRequest<void>('/auth/change-password', {
    auth: true,
    method: 'POST',
    body: request,
  })
}

export function getAccountSessionsRequest() {
  return apiRequest<AccountSession[]>('/account/sessions', {
    auth: true,
  })
}

export function revokeAccountSessionRequest(sessionId: string) {
  return apiRequest<void>(`/account/sessions/${sessionId}`, {
    auth: true,
    method: 'DELETE',
  })
}

export function revokeOtherAccountSessionsRequest() {
  return apiRequest<void>('/account/sessions', {
    auth: true,
    method: 'DELETE',
  })
}

export function getAccountNotificationPreferencesRequest() {
  return apiRequest<AccountNotificationPreference[]>(
    '/account/notification-preferences',
    {
      auth: true,
    },
  )
}

export function updateAccountNotificationPreferencesRequest(
  request: UpdateAccountNotificationPreferencesRequest,
) {
  return apiRequest<AccountNotificationPreference[]>(
    '/account/notification-preferences',
    {
      auth: true,
      method: 'PUT',
      body: request,
    },
  )
}

export function forgotPasswordRequest(request: ForgotPasswordRequest) {
  return apiRequest<void>('/auth/forgot-password', {
    method: 'POST',
    body: request,
  })
}

export function resetPasswordRequest(request: ResetPasswordRequest) {
  return apiRequest<void>('/auth/reset-password', {
    method: 'POST',
    body: request,
  })
}

export function confirmEmailRequest(request: ConfirmEmailRequest) {
  return apiRequest<void>('/auth/confirm-email', {
    method: 'POST',
    body: request,
  })
}

export function resendEmailConfirmationRequest(
  request: ResendEmailConfirmationRequest,
) {
  return apiRequest<void>('/auth/resend-email-confirmation', {
    method: 'POST',
    body: request,
  })
}
