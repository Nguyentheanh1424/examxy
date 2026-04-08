import type { FieldErrors } from '@/types/api'
import type {
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  ResendEmailConfirmationRequest,
  StudentRegisterRequest,
} from '@/types/auth'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isBlank(value: string) {
  return value.trim().length === 0
}

function validateEmailAddress(value: string) {
  return emailPattern.test(value.trim())
}

export function hasFieldErrors(errors: FieldErrors) {
  return Object.keys(errors).length > 0
}

export function validateLogin(values: LoginRequest) {
  const errors: FieldErrors<keyof LoginRequest> = {}

  if (isBlank(values.userNameOrEmail)) {
    errors.userNameOrEmail = 'Vui lòng nhập email hoặc tên đăng nhập.'
  }

  if (isBlank(values.password)) {
    errors.password = 'Vui lòng nhập mật khẩu.'
  }

  return errors
}

export function validateRegister(values: RegisterRequest) {
  const errors: FieldErrors<keyof RegisterRequest> = {}

  if (values.fullName && values.fullName.trim().length > 120) {
    errors.fullName = 'Full name must be 120 characters or fewer.'
  }

  if (isBlank(values.userName)) {
    errors.userName = 'Enter a username.'
  } else if (values.userName.trim().length < 3) {
    errors.userName = 'Username must be at least 3 characters.'
  } else if (values.userName.trim().length > 50) {
    errors.userName = 'Username must be 50 characters or fewer.'
  }

  if (isBlank(values.email)) {
    errors.email = 'Enter your email address.'
  } else if (!validateEmailAddress(values.email)) {
    errors.email = 'Enter a valid email address.'
  } else if (values.email.length > 256) {
    errors.email = 'Email must be 256 characters or fewer.'
  }

  if (isBlank(values.password)) {
    errors.password = 'Create a password.'
  } else if (values.password.length < 6) {
    errors.password = 'Password must be at least 6 characters.'
  } else if (values.password.length > 100) {
    errors.password = 'Password must be 100 characters or fewer.'
  }

  if (isBlank(values.confirmPassword)) {
    errors.confirmPassword = 'Confirm your password.'
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Confirm password must match password.'
  }

  return errors
}

export function validateStudentRegister(values: StudentRegisterRequest) {
  const errors: FieldErrors<keyof StudentRegisterRequest> = {}

  if (isBlank(values.fullName)) {
    errors.fullName = 'Enter your full name.'
  } else if (values.fullName.trim().length > 120) {
    errors.fullName = 'Full name must be 120 characters or fewer.'
  }

  if (isBlank(values.userName)) {
    errors.userName = 'Enter a username.'
  } else if (values.userName.trim().length < 3) {
    errors.userName = 'Username must be at least 3 characters.'
  } else if (values.userName.trim().length > 50) {
    errors.userName = 'Username must be 50 characters or fewer.'
  }

  if (isBlank(values.email)) {
    errors.email = 'Enter your email address.'
  } else if (!validateEmailAddress(values.email)) {
    errors.email = 'Enter a valid email address.'
  } else if (values.email.length > 256) {
    errors.email = 'Email must be 256 characters or fewer.'
  }

  if (values.studentCode.trim().length > 64) {
    errors.studentCode = 'Student code must be 64 characters or fewer.'
  }

  if (isBlank(values.password)) {
    errors.password = 'Create a password.'
  } else if (values.password.length < 6) {
    errors.password = 'Password must be at least 6 characters.'
  } else if (values.password.length > 100) {
    errors.password = 'Password must be 100 characters or fewer.'
  }

  if (isBlank(values.confirmPassword)) {
    errors.confirmPassword = 'Confirm your password.'
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Confirm password must match password.'
  }

  return errors
}

export function validateForgotPassword(values: ForgotPasswordRequest) {
  const errors: FieldErrors<keyof ForgotPasswordRequest> = {}

  if (isBlank(values.email)) {
    errors.email = 'Enter your email address.'
  } else if (!validateEmailAddress(values.email)) {
    errors.email = 'Enter a valid email address.'
  }

  return errors
}

export function validateResendEmailConfirmation(
  values: ResendEmailConfirmationRequest,
) {
  return validateForgotPassword(values)
}

export function validateChangePassword(values: ChangePasswordRequest) {
  const errors: FieldErrors<keyof ChangePasswordRequest> = {}

  if (isBlank(values.currentPassword)) {
    errors.currentPassword = 'Enter your current password.'
  }

  if (isBlank(values.newPassword)) {
    errors.newPassword = 'Enter your new password.'
  } else if (values.newPassword.length < 6) {
    errors.newPassword = 'New password must be at least 6 characters.'
  } else if (values.newPassword.length > 100) {
    errors.newPassword = 'New password must be 100 characters or fewer.'
  }

  if (isBlank(values.confirmNewPassword)) {
    errors.confirmNewPassword = 'Confirm your new password.'
  } else if (values.confirmNewPassword !== values.newPassword) {
    errors.confirmNewPassword = 'Confirm new password must match new password.'
  }

  return errors
}

export function validateResetPassword(values: ResetPasswordRequest) {
  const errors: FieldErrors<keyof ResetPasswordRequest> = {}

  if (!values.email || !validateEmailAddress(values.email)) {
    errors.email = 'The reset link is missing a valid email address.'
  }

  if (isBlank(values.token)) {
    errors.token = 'The reset link is missing a token.'
  }

  if (isBlank(values.newPassword)) {
    errors.newPassword = 'Enter your new password.'
  } else if (values.newPassword.length < 6) {
    errors.newPassword = 'New password must be at least 6 characters.'
  } else if (values.newPassword.length > 100) {
    errors.newPassword = 'New password must be 100 characters or fewer.'
  }

  if (isBlank(values.confirmNewPassword)) {
    errors.confirmNewPassword = 'Confirm your new password.'
  } else if (values.confirmNewPassword !== values.newPassword) {
    errors.confirmNewPassword = 'Confirm new password must match new password.'
  }

  return errors
}
