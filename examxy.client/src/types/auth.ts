export type AuthStatus = 'anonymous' | 'bootstrapping' | 'authenticated'

export interface AuthSession {
  userId: string
  userName: string
  email: string
  accessToken: string
  refreshToken: string
  expiresAtUtc: string
  roles: string[]
}

export interface CurrentUser {
  userId: string
  userName: string
  email: string
  emailConfirmed: boolean
  roles: string[]
}

export interface LoginRequest {
  userNameOrEmail: string
  password: string
}

export interface RegisterRequest {
  userName: string
  email: string
  password: string
  confirmPassword: string
}

export interface RefreshTokenRequest {
  accessToken: string
  refreshToken: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmNewPassword: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  email: string
  token: string
  newPassword: string
  confirmNewPassword: string
}

export interface ConfirmEmailRequest {
  userId: string
  token: string
}

export interface ResendEmailConfirmationRequest {
  email: string
}
