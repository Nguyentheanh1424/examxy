import type { FormEvent } from "react";
import { useState } from "react";
import { ArrowLeft, KeyRound, RotateCcw } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { TextField } from "@/components/ui/text-field";
import { AuthEdgeLayout } from "@/features/auth/components/auth-edge-layout";
import { resetPasswordRequest } from "@/features/auth/lib/auth-api";
import {
  hasFieldErrors,
  validateResetPassword,
} from "@/features/auth/lib/validation";
import { getErrorMessage, getFieldErrors } from "@/lib/http/api-error";
import { writeFlashNotice } from "@/lib/utils/flash-notice";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get("email") ?? "";
  const token = searchParams.get("token") ?? "";
  const [formState, setFormState] = useState({
    confirmNewPassword: "",
    newPassword: "",
  });
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<"confirmNewPassword" | "newPassword", string>>
  >({});
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasValidLink = Boolean(email && token);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextFieldErrors = validateResetPassword({
      confirmNewPassword: formState.confirmNewPassword,
      email,
      newPassword: formState.newPassword,
      token,
    });

    if (hasFieldErrors(nextFieldErrors)) {
      setFieldErrors({
        confirmNewPassword: nextFieldErrors.confirmNewPassword,
        newPassword: nextFieldErrors.newPassword,
      });

      if (nextFieldErrors.email || nextFieldErrors.token) {
        setSubmissionError(
          "Liên kết đặt lại này không đầy đủ hoặc không hợp lệ.",
        );
      }

      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      await resetPasswordRequest({
        confirmNewPassword: formState.confirmNewPassword,
        email,
        newPassword: formState.newPassword,
        token,
      });

      writeFlashNotice({
        message:
          "Mật khẩu của bạn đã được đặt lại. Vui lòng đăng nhập bằng mật khẩu mới.",
        title: "Mật khẩu đã được cập nhật",
        tone: "success",
      });
      navigate("/login", { replace: true });
    } catch (error) {
      const nextFieldErrorsFromApi = getFieldErrors(error);

      setFieldErrors({
        confirmNewPassword: nextFieldErrorsFromApi.confirmNewPassword as string,
        newPassword: nextFieldErrorsFromApi.newPassword as string,
      });
      setSubmissionError(
        getErrorMessage(error, "Không thể đặt lại mật khẩu của bạn."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthEdgeLayout>
      <header className="flex flex-col gap-5 text-center lg:text-left pb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-strong">
          Đặt lại mật khẩu
        </p>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-4xl">
            Chọn mật khẩu mới
          </h1>
          <p className="text-base leading-relaxed text-muted">
            Tạo một mật khẩu mới an toàn cho tài khoản của bạn để tiếp tục sử
            dụng Examxy.
          </p>
        </div>
      </header>

      {!hasValidLink ? (
        <Notice tone="warning" title="Liên kết không hợp lệ">
          Email đặt lại mật khẩu phải bao gồm cả `email` và `token`. Vui lòng mở
          lại email và sử dụng liên kết đầy đủ.
        </Notice>
      ) : null}

      {submissionError ? (
        <Notice tone="error" title="Không thể đặt lại mật khẩu">
          {submissionError}
        </Notice>
      ) : null}

      {hasValidLink ? (
        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <TextField
            autoComplete="new-password"
            error={fieldErrors.newPassword}
            hint={`Đang đặt lại mật khẩu cho ${email}`}
            label="Mật khẩu mới"
            leftIcon={<KeyRound className="size-4" />}
            onChange={(event) => {
              setFormState((currentState) => ({
                ...currentState,
                newPassword: event.target.value,
              }));
              setFieldErrors((currentErrors) => ({
                ...currentErrors,
                newPassword: undefined,
              }));
              setSubmissionError(null);
            }}
            placeholder="Nhập mật khẩu mới"
            type="password"
            value={formState.newPassword}
          />

          <TextField
            autoComplete="new-password"
            error={fieldErrors.confirmNewPassword}
            label="Xác nhận mật khẩu mới"
            leftIcon={<KeyRound className="size-4" />}
            onChange={(event) => {
              setFormState((currentState) => ({
                ...currentState,
                confirmNewPassword: event.target.value,
              }));
              setFieldErrors((currentErrors) => ({
                ...currentErrors,
                confirmNewPassword: undefined,
              }));
              setSubmissionError(null);
            }}
            placeholder="Nhập lại mật khẩu mới"
            type="password"
            value={formState.confirmNewPassword}
          />

          <Button
            className="mt-4 rounded-2xl shadow-[0_22px_44px_-24px_rgba(42,94,204,0.75)]"
            fullWidth
            isLoading={isSubmitting}
            leftIcon={<RotateCcw className="size-4" />}
            size="lg"
            type="submit"
          >
            Lưu mật khẩu mới
          </Button>
        </form>
      ) : null}

      <div className="flex flex-col gap-5 border-t border-line/80 pt-4 text-center lg:text-left">
        <Link
          className="inline-flex items-center justify-center lg:justify-start gap-2 text-base font-semibold text-brand-strong transition hover:text-brand"
          to="/login"
        >
          <ArrowLeft className="size-4" />
          Quay lại đăng nhập
        </Link>
      </div>
    </AuthEdgeLayout>
  );
}
