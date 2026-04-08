export const authCopy = {
  forgotPassword: {
    submitButton: 'Gửi hướng dẫn đặt lại',
    successMessage:
      'Nếu địa chỉ này thuộc về một tài khoản đã xác nhận, Examxy sẽ gửi hướng dẫn đặt lại mật khẩu.',
  },
  login: {
    socialDivider: 'Hoặc tiếp tục với',
    socialProviderLabel: 'Google',
    socialPopupTitle: 'Đang hoàn thiện',
    socialPopupConfirm: 'Đã hiểu',
  },
  resetPassword: {
    invalidLinkMessage:
      'Email đặt lại mật khẩu phải bao gồm cả `email` và `token`. Vui lòng mở lại email và sử dụng liên kết đầy đủ.',
    submitButton: 'Lưu mật khẩu mới',
    successFlashMessage: 'Mật khẩu đã được cập nhật',
  },
  confirmEmail: {
    invalidLinkMessage:
      'Trang này cần cả mã định danh người dùng và mã xác thực từ liên kết email. Vui lòng kiểm tra lại email của bạn.',
    successMessage: 'Đã xác nhận email',
  },
  loginAsset: {
    heroFallbackAlt: 'Minh họa học tập của Examxy',
  },
} as const
